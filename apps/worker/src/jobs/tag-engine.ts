import type { Job } from "bullmq";
import { prisma } from "@/lib/db";
import { applyAutoTags } from "@/lib/scoring/autoTags";

/**
 * 自动标签：按 wallet_metric 派生 + 写回 wallet_tag
 */
export async function tagEngineHandler(job: Job) {
  const metrics = await prisma.walletMetric.findMany({
    include: { wallet: { include: { manualTags: true } } },
  });
  for (const m of metrics) {
    const snap = {
      avgHoldingHours: m.avgHoldingHours ? Number(m.avgHoldingHours) : undefined,
      winRate: m.winRate ? Number(m.winRate) : undefined,
      avgBuyUsd: m.realizedPnlUsd ? Number(m.realizedPnlUsd) : undefined,
      holdingCount: undefined,
    };
    const slugs = applyAutoTags(snap);
    for (const slug of slugs) {
      const tag = await prisma.tag.upsert({
        where: { slug },
        create: { slug, name: slug, category: "STYLE", isAuto: true },
        update: {},
      });
      await prisma.walletTag.upsert({
        where: { walletAddress_tagId: { walletAddress: m.walletAddress, tagId: tag.id } },
        create: { walletAddress: m.walletAddress, tagId: tag.id, source: "auto" },
        update: {},
      });
    }
  }
  return { updated: metrics.length };
}
