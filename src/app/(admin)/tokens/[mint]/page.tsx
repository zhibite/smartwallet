import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import TokenHeader from "@/components/tokens/TokenHeader";
import TokenKlineChart from "@/components/tokens/TokenKlineChart";
import TokenHolders from "@/components/tokens/TokenHolders";

export const dynamic = "force-dynamic";

export default async function TokenDetail({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = await params;

  const token = await prisma.token.findUnique({
    where: { mint },
    include: {
      pricePoints: { orderBy: { ts: "desc" }, take: 200 },
      holdings: {
        include: { wallet: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!token) notFound();

  const header = {
    mint: token.mint,
    symbol: token.symbol,
    name: token.name,
    logoUri: token.logoUri,
    decimals: token.decimals,
    priceUsd: token.priceUsd?.toString() ?? null,
    priceChange1h: token.priceChange1h?.toString() ?? null,
    priceChange24h: token.priceChange24h?.toString() ?? null,
    priceChange7d: token.priceChange7d?.toString() ?? null,
    mcapUsd: token.mcapUsd?.toString() ?? null,
    liquidityUsd: token.liquidityUsd?.toString() ?? null,
    holdersCount: token.holdersCount,
    smartHolders: token.smartHolders,
    honeypotRisk: token.honeypotRisk,
    riskScore: token.riskScore,
    deployer: token.deployer,
    renouncedMint: token.renouncedMint,
    firstSeenAt: token.firstSeenAt.toISOString(),
  };

  const klines = token.pricePoints
    .map((p) => ({
      ts: p.ts.toISOString(),
      priceUsd: p.priceUsd?.toString() ?? null,
      mcapUsd: p.mcapUsd?.toString() ?? null,
      liquidityUsd: p.liquidityUsd?.toString() ?? null,
    }))
    .reverse();

  const holders = token.holdings.map((h) => ({
    wallet: h.walletAddr,
    label: h.wallet.label,
    amount: h.amount.toString(),
    remainingAmount: h.remainingAmount.toString(),
    costBasisUsd: h.costBasisUsd.toString(),
    acquiredAt: h.acquiredAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <TokenHeader data={header} />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Price (last 200 snapshots)
        </h2>
        <TokenKlineChart points={klines} />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Smart Money Holders
        </h2>
        <TokenHolders holders={holders} />
      </div>
    </div>
  );
}
