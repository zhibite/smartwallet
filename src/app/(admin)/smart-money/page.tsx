import { prisma } from "@/lib/db";
import ImportWalletButton from "@/components/smart-money/ImportWalletButton";
import SmartMoneyTable from "@/components/smart-money/SmartMoneyTable";

export const dynamic = "force-dynamic";

export default async function SmartMoneyPage() {
  const wallets = await prisma.wallet.findMany({
    take: 200,
    orderBy: { firstSeenAt: "desc" },
    include: {
      manualTags: { include: { tag: true } },
      metrics: true,
    },
  });

  const serialized = wallets.map((w) => ({
    address: w.address,
    label: w.label,
    enabled: w.enabled,
    trustScore: w.trustScore,
    firstSeenAt: w.firstSeenAt.toISOString(),
    tags: w.manualTags.map((t) => ({
      slug: t.tag.slug,
      name: t.tag.name,
      category: t.tag.category,
    })),
    metrics: w.metrics
      ? {
          winRate: w.metrics.winRate?.toString() ?? null,
          roi30d: w.metrics.roi30d?.toString() ?? null,
          pnl30dUsd: w.metrics.pnl30dUsd?.toString() ?? null,
          avgHoldingHours: w.metrics.avgHoldingHours?.toString() ?? null,
          tradesCount: w.metrics.tradesCount,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Smart Money Wallets
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage the 50 hand-picked wallets that feed our signal engine.
          </p>
        </div>
        <ImportWalletButton />
      </div>

      <SmartMoneyTable wallets={serialized} />
    </div>
  );
}
