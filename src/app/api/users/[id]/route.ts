import { z } from "zod";
import { requireAdmin, recordAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, json } from "@/lib/http";

const schema = z.object({
  enabled: z.boolean().optional(),
  role: z.enum(["ADMIN", "VIEWER"]).optional(),
  displayName: z.string().max(120).nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  const { id } = await ctx.params;
  try {
    const data = schema.parse(await req.json());
    const u = await prisma.user.update({ where: { id }, data });
    await recordAudit(session.uid, "user.update", id, data);
    return json(u);
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.message, 400);
    return fail(e instanceof Error ? e.message : "Update failed", 500);
  }
}
