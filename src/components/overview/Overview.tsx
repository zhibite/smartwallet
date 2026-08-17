import { prisma } from "@/lib/db";
import OverviewMetrics from "@/components/overview/OverviewMetrics";
import HotTokensTop10 from "@/components/overview/HotTokensTop10";
import TopPnlWallets from "@/components/overview/TopPnlWallets";
import RecentSignals from "@/components/overview/RecentSignals";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const [
    walletsTotal,
    walletsEnabled,
    tokensTracked,
    signals24h,
    topTokens,
    topWallets,
    recentSignals,
  ] = await Promise.all([
    prisma.wallet.count(),
    prisma.wallet.count({ where: { enabled: true } }),
    prisma.token.count(),
    prisma.signal.count({
      where: { detectedAt: { gte: new Date(Date.now() - 24 * 3600_000) } },
    }),
    prisma.token.findMany({
      where: { smartHolders: { gt: 0 } },
      orderBy: { smartHolders: "desc" },
      take: 10,
      select: {
        mint: true,
        symbol: true,
        name: true,
        smartHolders: true,
        mcapUsd: true,
        priceChange1h: true,
      },
    }),
    prisma.walletMetric.findMany({
      orderBy: { pnl30dUsd: "desc" },
      take: 10,
      include: { wallet: true },
    }),
    prisma.signal.findMany({
      orderBy: { detectedAt: "desc" },
      take: 12,
      include: { token: true },
    }),
  ]);

  const topTokensSerialized = topTokens.map((t) => ({
    mint: t.mint,
    symbol: t.symbol,
    name: t.name,
    smartHolders: t.smartHolders,
    mcapUsd: t.mcapUsd ? t.mcapUsd.toString() : null,
    priceChange1h: t.priceChange1h ? t.priceChange1h.toString() : null,
  }));

  return (
    <div className="space-y-6">
      <OverviewMetrics
        walletsTotal={walletsTotal}
        walletsEnabled={walletsEnabled}
        tokensTracked={tokensTracked}
        signals24h={signals24h}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <HotTokensTop10 tokens={topTokensSerialized} />
        <TopPnlWallets wallets={topWallets} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Signals
          </h2>
          <Link
            href="/signals"
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            View all
          </Link>
        </div>
        <RecentSignals signals={recentSignals} />
      </div>
    </div>
  );
}
