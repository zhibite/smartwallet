import { prisma } from "@/lib/db";
import FollowWatchlist from "@/components/follow-output/FollowWatchlist";

export const dynamic = "force-dynamic";

export default async function FollowOutputPage() {
  const tokens = await prisma.token.findMany({
    where: { smartHolders: { gte: 2 } },
    orderBy: [{ smartHolders: "desc" }, { mcapUsd: "desc" }],
    take: 100,
  });
  const rows = tokens.map((t) => ({
    mint: t.mint,
    symbol: t.symbol,
    name: t.name,
    smartHolders: t.smartHolders,
    mcapUsd: t.mcapUsd?.toString() ?? null,
    liquidityUsd: t.liquidityUsd?.toString() ?? null,
    riskScore: t.riskScore,
  }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Follow Output
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tokens followed by at least 2 smart money wallets — exported to JSON/CSV or pushed to your follow-system via webhook.
        </p>
      </div>
      <FollowWatchlist tokens={rows} />
    </div>
  );
}
