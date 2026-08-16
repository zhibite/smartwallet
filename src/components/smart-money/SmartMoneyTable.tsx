import Link from "next/link";

type WalletRow = {
  address: string;
  label: string | null;
  enabled: boolean;
  trustScore: number | null;
  tags: Array<{ slug: string; name: string }>;
  metrics: {
    winRate: string | null;
    roi30d: string | null;
    pnl30dUsd: string | null;
    avgHoldingHours: string | null;
    tradesCount: number;
  } | null;
};

export default function SmartMoneyTable({ wallets }: { wallets: WalletRow[] }) {
  if (wallets.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No smart money wallets yet. Click "Import Wallets" to add your first 50.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-zinc-700">
          <tr>
            <th className="px-6 py-3">Wallet</th>
            <th className="px-6 py-3">Label</th>
            <th className="px-6 py-3">Tags</th>
            <th className="px-6 py-3">30d PnL</th>
            <th className="px-6 py-3">Win Rate</th>
            <th className="px-6 py-3">Trades</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((w) => (
            <tr
              key={w.address}
              className="border-b border-gray-100 dark:border-zinc-700"
            >
              <td className="px-6 py-4 font-mono text-xs">
                <Link
                  href={`/smart-money/${w.address}`}
                  className="text-brand-500 hover:text-brand-600"
                >
                  {w.address.slice(0, 6)}…{w.address.slice(-4)}
                </Link>
              </td>
              <td className="px-6 py-4">{w.label ?? "—"}</td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {w.tags.map((t) => (
                    <span
                      key={t.slug}
                      className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4">
                {w.metrics?.pnl30dUsd
                  ? `$${Number(w.metrics.pnl30dUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : "—"}
              </td>
              <td className="px-6 py-4">
                {w.metrics?.winRate
                  ? `${(Number(w.metrics.winRate) * 100).toFixed(1)}%`
                  : "—"}
              </td>
              <td className="px-6 py-4">{w.metrics?.tradesCount ?? 0}</td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    w.enabled
                      ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                      : "bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-400"
                  }`}
                >
                  {w.enabled ? "Active" : "Disabled"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
