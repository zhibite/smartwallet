import dayjs from "dayjs";

type Trade = {
  id: string;
  txSig: string;
  direction: string;
  wallet: string;
  label: string | null;
  tokenMint: string;
  usdAmount: string | null;
  priceUsd: string | null;
  dex: string | null;
  blockTime: string;
  isFailed: boolean;
};

export default function TradesTable({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No transactions yet.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-zinc-700">
          <tr>
            <th className="px-6 py-3">Time</th>
            <th className="px-6 py-3">Wallet</th>
            <th className="px-6 py-3">Direction</th>
            <th className="px-6 py-3">Token</th>
            <th className="px-6 py-3">USD</th>
            <th className="px-6 py-3">DEX</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr
              key={t.id}
              className="border-b border-gray-100 dark:border-zinc-700"
            >
              <td className="px-6 py-4 text-xs text-gray-500">
                {dayjs(t.blockTime).format("MM-DD HH:mm:ss")}
              </td>
              <td className="px-6 py-4 font-mono text-xs">
                <a
                  href={`/smart-money/${t.wallet}`}
                  className="text-brand-500 hover:text-brand-600"
                >
                  {t.label ?? `${t.wallet.slice(0, 6)}…`}
                </a>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    t.direction === "BUY"
                      ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                      : t.direction === "SELL"
                        ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                        : "bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-400"
                  }`}
                >
                  {t.direction}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-xs">
                <a
                  href={`/tokens/${t.tokenMint}`}
                  className="text-brand-500 hover:text-brand-600"
                >
                  {t.tokenMint.slice(0, 6)}…
                </a>
              </td>
              <td className="px-6 py-4">
                {t.usdAmount ? `$${Number(t.usdAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
              </td>
              <td className="px-6 py-4 text-xs text-gray-500">{t.dex ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
