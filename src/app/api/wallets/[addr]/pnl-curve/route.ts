import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, json } from "@/lib/http";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ addr: string }> },
) {
  await requireSession();
  const { addr } = await ctx.params;

  const since = new Date(Date.now() - 30 * 24 * 3600_000);

  // Daily realized PnL approximated via grouped Trade sums
  const trades = await prisma.trade.findMany({
    where: { walletAddr: addr, blockTime: { gte: since } },
    orderBy: { blockTime: "asc" },
  });

  const buckets = new Map<string, number>();
  let running = 0;
  for (const t of trades) {
    if (t.direction === "SELL" && t.usdAmount != null && t.priceUsd != null) {
      // Very rough: realized ≈ (priceUsd - avg cost) * amount
      // For demo we just plot cumulative SELL volume
      const dayKey = t.blockTime.toISOString().slice(0, 10);
      running += Number(t.usdAmount);
      buckets.set(dayKey, running);
    }
  }
  const data = Array.from(buckets.entries()).map(([ts, pnlUsd]) => ({
    ts: new Date(ts).toISOString(),
    pnlUsd,
  }));

  return json(data);
}
