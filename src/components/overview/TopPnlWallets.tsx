import Link from "next/link";

type WalletMetric = {
  walletAddress: string;
  wallet: { address: string; label: string | null };
  pnl30dUsd: unknown;
  roi30d: unknown;
  winRate: unknown;
  tradesCount: number;
};

export default function TopPnlWallets({ wallets }: { wallets: WalletMetric[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Top Wallets (30d PnL)
      </h2>
      {wallets.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No metrics computed yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {wallets.slice(0, 10).map((w) => (
            <li
              key={w.walletAddress}
              className="flex items-center justify-between text-sm"
            >
              <Link
                href={`/smart-money/${w.wallet.address}`}
                className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
              >
                {w.wallet.label ?? `${w.wallet.address.slice(0, 6)}…${w.wallet.address.slice(-4)}`}
              </Link>
              <div className="flex gap-4 text-right">
                <span className="text-gray-500 dark:text-gray-400">
                  {w.tradesCount} trades
                </span>
                <span className="font-medium text-gray-800 dark:text-white/90">
                  {w.pnl30dUsd
                    ? `$${Number(w.pnl30dUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : "—"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
