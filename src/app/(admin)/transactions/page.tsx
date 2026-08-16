import { prisma } from "@/lib/db";
import TradesTable from "@/components/trades/TradesTable";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const trades = await prisma.trade.findMany({
    orderBy: { blockTime: "desc" },
    take: 200,
    include: { wallet: true },
  });
  const rows = trades.map((t) => ({
    id: t.id,
    txSig: t.txSig,
    direction: t.direction,
    wallet: t.wallet.address,
    label: t.wallet.label,
    tokenMint: t.tokenMint,
    usdAmount: t.usdAmount?.toString() ?? null,
    priceUsd: t.priceUsd?.toString() ?? null,
    dex: t.dex,
    blockTime: t.blockTime.toISOString(),
    isFailed: t.isFailed,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Latest 200 trades seen across all tracked smart money wallets.
        </p>
      </div>
      <TradesTable trades={rows} />
    </div>
  );
}
