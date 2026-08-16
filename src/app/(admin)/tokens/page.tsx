import { prisma } from "@/lib/db";
import TokenTable from "@/components/tokens/TokenTable";

export const dynamic = "force-dynamic";

export default async function TokensPage() {
  const tokens = await prisma.token.findMany({
    orderBy: { smartHolders: { sort: "desc", nulls: "last" } },
    take: 200,
  });

  const rows = tokens.map((t) => ({
    mint: t.mint,
    symbol: t.symbol,
    name: t.name,
    logoUri: t.logoUri,
    priceUsd: t.priceUsd?.toString() ?? null,
    mcapUsd: t.mcapUsd?.toString() ?? null,
    liquidityUsd: t.liquidityUsd?.toString() ?? null,
    smartHolders: t.smartHolders,
    priceChange1h: t.priceChange1h?.toString() ?? null,
    priceChange24h: t.priceChange24h?.toString() ?? null,
    honeypotRisk: t.honeypotRisk,
    riskScore: t.riskScore,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Tokens
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tokens seen by smart money wallets, sorted by smart-holder count.
        </p>
      </div>
      <TokenTable tokens={rows} />
    </div>
  );
}
