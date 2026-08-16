import dayjs from "dayjs";

type Trade = {
  id: string;
  txSig: string;
  direction: string;
  tokenMint: string;
  tokenAmount: string;
  usdAmount: string | null;
  priceUsd: string | null;
  dex: string | null;
  blockTime: string;
  isFailed: boolean;
};

export default function TradeTable({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No trades recorded yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-zinc-700">
          <tr>
            <th className="py-2">Time</th>
            <th className="py-2">Direction</th>
            <th className="py-2">Token</th>
            <th className="py-2">Amount</th>
            <th className="py-2">USD</th>
            <th className="py-2">DEX</th>
            <th className="py-2">Tx</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr
              key={t.id}
              className="border-b border-gray-100 dark:border-zinc-700"
            >
              <td className="py-3 text-xs text-gray-500">
                {dayjs(t.blockTime).format("MM-DD HH:mm:ss")}
              </td>
              <td className="py-3">
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
              <td className="py-3 font-mono text-xs">
                {t.tokenMint.slice(0, 6)}…{t.tokenMint.slice(-4)}
              </td>
              <td className="py-3">{Number(t.tokenAmount).toLocaleString()}</td>
              <td className="py-3">
                {t.usdAmount ? `$${Number(t.usdAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
              </td>
              <td className="py-3 text-xs text-gray-500">{t.dex ?? "—"}</td>
              <td className="py-3 font-mono text-xs">
                <a
                  href={`https://solscan.io/tx/${t.txSig}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-500 hover:text-brand-600"
                >
                  {t.txSig.slice(0, 6)}…
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
