import Link from "next/link";
import dayjs from "dayjs";

type Signal = {
  id: string;
  type: string;
  tokenMint: string;
  token: { symbol: string | null; name: string | null };
  strength: number;
  detectedAt: Date | string;
};

const TYPE_LABEL: Record<string, string> = {
  CONSENSUS_BUY: "Consensus Buy",
  WHALE_BUY: "Whale Buy",
  NEW_TOKEN_FOMO: "New Token FOMO",
  GROUP_SELL: "Group Sell",
  HOLDING_CLEARED: "Holding Cleared",
  PRICE_ANOMALY: "Price Anomaly",
};

export default function RecentSignals({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No signals yet. Consensus detection will populate this list.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-gray-100 dark:divide-zinc-700">
      {signals.map((s) => (
        <li key={s.id} className="flex items-center justify-between py-3">
          <div>
            <Link
              href={`/tokens/${s.tokenMint}`}
              className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
            >
              {s.token.symbol ?? s.tokenMint.slice(0, 6) + "…"}
            </Link>
            <span className="ml-2 text-xs text-gray-400">
              {TYPE_LABEL[s.type] ?? s.type}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-gray-800 dark:text-white/90">
              {s.strength}
            </span>
            <span className="text-xs text-gray-400">
              {dayjs(s.detectedAt).format("MM-DD HH:mm")}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
