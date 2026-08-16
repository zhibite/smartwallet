import type { Job } from "bullmq";
import { prisma } from "@/lib/db";
import { detectConsensus } from "@/lib/signals/consensus";
import { queues, QUEUE_NAMES } from "../queue";

interface SignalPayload {
  walletAddress: string;
  signature: string;
  blockTime: number;
}

/**
 * 滑动窗口共识检测：每次新成交触发，对该 tokenMint 最近 1h 内的买入做聚合
 */
export async function signalDetectHandler(job: Job<SignalPayload>) {
  const { blockTime } = job.data;
  const since = new Date(blockTime - 60 * 60_000);
  const until = new Date(blockTime + 60_000);

  const trades = await prisma.trade.findMany({
    where: {
      direction: "BUY",
      blockTime: { gte: since, lte: until },
    },
    select: {
      tokenMint: true,
      blockTime: true,
      walletAddr: true,
      direction: true,
      usdAmount: true,
    },
  });

  const inputs = trades.map((t) => ({
    tokenMint: t.tokenMint,
    timestamp: t.blockTime,
    walletAddress: t.walletAddr,
    direction: "BUY" as const,
    usdAmount: t.usdAmount ? Number(t.usdAmount) : 0,
  }));

  const detections = detectConsensus(inputs, {
    windowMinutes: 60,
    minWallets: 3,
    minUsdTotal: 50_000,
  });

  let written = 0;
  for (const d of detections) {
    // 去重：最近 10min 同一 tokenMint 同类型不重复
    const recent = await prisma.signal.findFirst({
      where: {
        tokenMint: d.tokenMint,
        type: "CONSENSUS_BUY",
        detectedAt: { gte: new Date(Date.now() - 10 * 60_000) },
      },
    });
    if (recent) continue;
    await prisma.signal.create({
      data: {
        type: "CONSENSUS_BUY",
        tokenMint: d.tokenMint,
        strength: Math.min(100, d.strength),
        windowStart: d.windowStart,
        windowEnd: d.windowEnd,
        metadata: {
          count: d.count,
          totalUsd: d.totalUsd,
        },
      },
    });
    await queues.alertDispatch.add(
      "fanout",
      { signalType: "CONSENSUS_BUY", tokenMint: d.tokenMint, strength: d.strength },
      { removeOnComplete: true },
    );
    written++;
  }
  return { written };
}
