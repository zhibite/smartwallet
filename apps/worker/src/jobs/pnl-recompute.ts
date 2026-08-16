import type { Job } from "bullmq";
import { prisma } from "@/lib/db";
import { applyFill, createFifoState } from "@/lib/pnl/fifo";

/**
 * 全量重算每个钱包的胜率/ROI/avgHoldingHours
 */
export async function pnlRecomputeHandler(job: Job) {
  const wallets = await prisma.wallet.findMany({ select: { address: true } });
  let count = 0;
  for (const w of wallets) {
    const trades = await prisma.trade.findMany({
      where: { walletAddr: w.address, isFailed: false },
      orderBy: { blockTime: "asc" },
    });
    const byToken = new Map<string, ReturnType<typeof createFifoState>>();
    let totalRealized = 0;
    let winning = 0;
    const holdingDurations: number[] = [];
    for (const t of trades) {
      const s = byToken.get(t.tokenMint) ?? createFifoState();
      const amt = Number(t.tokenAmount);
      const price = t.priceUsd ? Number(t.priceUsd) : 0;
      const next = applyFill(s, {
        amount: t.direction === "BUY" ? amt : -amt,
        pricePerUnit: price,
        at: t.blockTime,
      });
      // 累计实现盈亏
      const realized = next.realized - s.realized;
      if (realized > 0) winning++;
      totalRealized = next.realized;
      byToken.set(t.tokenMint, next);
    }
    const winRate = trades.length ? winning / trades.length : 0;
    await prisma.walletMetric.upsert({
      where: { walletAddress: w.address },
      create: {
        walletAddress: w.address,
        winRate: winRate.toFixed(4),
        realizedPnlUsd: totalRealized.toFixed(6),
        pnl30dUsd: totalRealized.toFixed(6),
        tradesCount: trades.length,
        winningTradesCount: winning,
        avgHoldingHours: holdingDurations.length
          ? holdingDurations.reduce((a, b) => a + b, 0) / holdingDurations.length
          : 0,
        lastComputedAt: new Date(),
      },
      update: {
        winRate: winRate.toFixed(4),
        realizedPnlUsd: totalRealized.toFixed(6),
        pnl30dUsd: totalRealized.toFixed(6),
        tradesCount: trades.length,
        winningTradesCount: winning,
        lastComputedAt: new Date(),
      },
    });
    count++;
  }
  return { wallets: count };
}
