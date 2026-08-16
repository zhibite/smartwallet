import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, json } from "@/lib/http";

/**
 * Run a saved query: 简单 demo 实现，按 scope 决定查哪张表
 */
export async function POST(
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

  const c = q.criteria as Record<string, unknown>;

  if (q.scope === "wallet") {
    const winRate = (c.winRate as { min?: number; max?: number } | undefined) ?? {};
    const where = {
      metrics: {
        ...(winRate.min != null ? { winRate: { gte: winRate.min } } : {}),
        ...(winRate.max != null ? { winRate: { lte: winRate.max } } : {}),
      },
    };
    const rows = await prisma.wallet.findMany({ where, take: 200 });
    return json({ count: rows.length, items: rows.slice(0, 50) });
  }

  if (q.scope === "token") {
    const where = {
      ...(c.smartHoldersMin != null
        ? { smartHolders: { gte: c.smartHoldersMin as number } }
        : {}),
    };
    const rows = await prisma.token.findMany({ where, take: 200 });
    return json({ count: rows.length, items: rows.slice(0, 50) });
  }

  return fail("Unknown scope", 400);
}
