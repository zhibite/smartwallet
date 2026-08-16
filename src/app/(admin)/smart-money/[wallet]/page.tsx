import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import WalletHeader from "@/components/smart-money/WalletHeader";
import PnlCurve from "@/components/smart-money/PnlCurve";
import HoldingList from "@/components/smart-money/HoldingList";
import TradeTable from "@/components/smart-money/TradeTable";

export const dynamic = "force-dynamic";

export default async function SmartMoneyDetail({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;

  const record = await prisma.wallet.findUnique({
    where: { address: wallet },
    include: {
      manualTags: { include: { tag: true } },
      metrics: true,
      syncStatus: true,
      holdings: {
        include: { token: true },
        orderBy: { updatedAt: "desc" },
      },
      trades: {
        orderBy: { blockTime: "desc" },
        take: 200,
      },
    },
  });
  if (!record) notFound();

  const headerData = {
    address: record.address,
    label: record.label,
    source: record.source,
    enabled: record.enabled,
    trustScore: record.trustScore,
    notes: record.notes,
    tags: record.manualTags.map((t) => ({
      slug: t.tag.slug,
      name: t.tag.name,
      category: t.tag.category,
      source: t.source,
    })),
    sync: record.syncStatus
      ? {
          status: record.syncStatus.status,
          lastSyncedAt: record.syncStatus.lastSyncedAt?.toISOString() ?? null,
          lagSeconds: record.syncStatus.lagSeconds,
        }
      : null,
    metrics: record.metrics
      ? {
          winRate: record.metrics.winRate?.toString() ?? null,
          roi30d: record.metrics.roi30d?.toString() ?? null,
          pnl30dUsd: record.metrics.pnl30dUsd?.toString() ?? null,
          realizedPnlUsd: record.metrics.realizedPnlUsd?.toString() ?? null,
          avgHoldingHours: record.metrics.avgHoldingHours?.toString() ?? null,
          tradesCount: record.metrics.tradesCount,
          winningTradesCount: record.metrics.winningTradesCount,
        }
      : null,
  };

  const holdings = record.holdings.map((h) => ({
    mint: h.tokenMint,
    symbol: h.token.symbol,
    name: h.token.name,
    amount: h.amount.toString(),
    costBasisUsd: h.costBasisUsd.toString(),
    remainingAmount: h.remainingAmount.toString(),
    acquiredAt: h.acquiredAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
    priceUsd: h.token.priceUsd?.toString() ?? null,
  }));

  const trades = record.trades.map((t) => ({
    id: t.id,
    txSig: t.txSig,
    direction: t.direction,
    tokenMint: t.tokenMint,
    tokenAmount: t.tokenAmount.toString(),
    usdAmount: t.usdAmount?.toString() ?? null,
    priceUsd: t.priceUsd?.toString() ?? null,
    dex: t.dex,
    blockTime: t.blockTime.toISOString(),
    isFailed: t.isFailed,
  }));

  return (
    <div className="space-y-6">
      <WalletHeader data={headerData} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            PnL Curve (30d)
          </h2>
          <PnlCurve walletAddress={record.address} />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Current Holdings
          </h2>
          <HoldingList holdings={holdings} />
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Recent Trades
        </h2>
        <TradeTable trades={trades} />
      </div>
    </div>
  );
}
