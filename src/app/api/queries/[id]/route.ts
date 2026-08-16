import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, json } from "@/lib/http";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  const { id } = await ctx.params;
  const q = await prisma.savedQuery.findUnique({ where: { id } });
  if (!q) return fail("Not found", 404);
  if (q.userId !== session.uid && session.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }
  await prisma.savedQuery.delete({ where: { id } });
  return json({ ok: true });
}
