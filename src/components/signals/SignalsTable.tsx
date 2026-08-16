import dayjs from "dayjs";

type Signal = {
  id: string;
  type: string;
  tokenMint: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  strength: number;
  detectedAt: string;
  windowStart: string;
  windowEnd: string;
  dispatched: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  CONSENSUS_BUY: "Consensus Buy",
  WHALE_BUY: "Whale Buy",
  NEW_TOKEN_FOMO: "New Token FOMO",
  GROUP_SELL: "Group Sell",
  HOLDING_CLEARED: "Holding Cleared",
  PRICE_ANOMALY: "Price Anomaly",
};

export default function SignalsTable({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No signals yet.
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
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Token</th>
            <th className="px-6 py-3">Strength</th>
            <th className="px-6 py-3">Window</th>
            <th className="px-6 py-3">Dispatched</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => (
            <tr
              key={s.id}
              className="border-b border-gray-100 dark:border-zinc-700"
            >
              <td className="px-6 py-4 text-xs text-gray-500">
                {dayjs(s.detectedAt).format("MM-DD HH:mm:ss")}
              </td>
              <td className="px-6 py-4">
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {TYPE_LABEL[s.type] ?? s.type}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-xs">
                <a
                  href={`/tokens/${s.tokenMint}`}
                  className="text-brand-500 hover:text-brand-600"
                >
                  {s.tokenSymbol ?? `${s.tokenMint.slice(0, 6)}…`}
                </a>
              </td>
              <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">
                {s.strength}
              </td>
              <td className="px-6 py-4 text-xs text-gray-500">
                {dayjs(s.windowStart).format("MM-DD HH:mm")} ~ {dayjs(s.windowEnd).format("HH:mm")}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    s.dispatched
                      ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                      : "bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-400"
                  }`}
                >
                  {s.dispatched ? "Yes" : "Pending"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
