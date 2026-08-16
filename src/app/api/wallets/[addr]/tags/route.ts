import { z } from "zod";
import { prisma } from "@/lib/db";
import { recordAudit, requireAdmin } from "@/lib/auth";
import { fail, json } from "@/lib/http";

const schema = z.object({
  tags: z.array(z.string()).min(1),
  source: z.enum(["manual", "auto"]).default("manual"),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ addr: string }> },
) {
  const session = await requireAdmin();
  const { addr } = await ctx.params;
  try {
    const { tags, source } = schema.parse(await req.json());
    await prisma.$transaction(async (tx) => {
      await tx.walletTag.deleteMany({ where: { walletAddress: addr } });
      for (const slug of tags) {
        const tag = await tx.tag.upsert({
          where: { slug },
          create: {
            slug,
            name: slug,
            category: "STYLE",
            isAuto: source === "auto",
          },
          update: {},
        });
        await tx.walletTag.create({
          data: { walletAddress: addr, tagId: tag.id, source },
        });
      }
    });
    await recordAudit(session.uid, "wallet.tags.set", addr, { tags, source });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.message, 400);
    return fail(e instanceof Error ? e.message : "Failed", 500);
  }
}
