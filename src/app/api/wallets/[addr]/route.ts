import { z } from "zod";
import { prisma } from "@/lib/db";
import { recordAudit, requireAdmin } from "@/lib/auth";
import { fail, json } from "@/lib/http";

const schema = z.object({
  label: z.string().max(120).optional(),
  source: z.string().max(120).optional(),
  enabled: z.boolean().optional(),
  trustScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ addr: string }> },
) {
  const session = await requireAdmin();
  const { addr } = await ctx.params;
  try {
    const data = schema.parse(await req.json());
    const updated = await prisma.wallet.update({
      where: { address: addr },
      data,
    });
    await recordAudit(session.uid, "wallet.update", addr, data);
    return json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.message, 400);
    return fail(e instanceof Error ? e.message : "Update failed", 500);
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ addr: string }> },
) {
  const session = await requireAdmin();
  const { addr } = await ctx.params;
  await prisma.wallet.delete({ where: { address: addr } });
  await recordAudit(session.uid, "wallet.delete", addr);
  return json({ ok: true });
}
