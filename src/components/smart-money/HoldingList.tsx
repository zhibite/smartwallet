import Link from "next/link";

type Holding = {
  mint: string;
  symbol: string | null;
  name: string | null;
  amount: string;
  remainingAmount: string;
  costBasisUsd: string;
  acquiredAt: string;
  updatedAt: string;
  priceUsd: string | null;
};

export default function HoldingList({ holdings }: { holdings: Holding[] }) {
  if (holdings.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No current holdings.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-gray-100 dark:divide-zinc-700">
      {holdings.map((h) => {
        const qty = Number(h.remainingAmount);
        const price = h.priceUsd ? Number(h.priceUsd) : 0;
        const market = qty * price;
        return (
          <li key={h.mint} className="flex items-center justify-between py-3 text-sm">
            <div>
              <Link
                href={`/tokens/${h.mint}`}
                className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
              >
                {h.symbol ?? h.mint.slice(0, 6) + "…"}
              </Link>
              {h.name && (
                <span className="ml-2 text-xs text-gray-400">{h.name}</span>
              )}
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-800 dark:text-white/90">
                {h.priceUsd ? `$${market.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
              </p>
              <p className="text-xs text-gray-400">
                {qty.toLocaleString()} · cost ${Number(h.costBasisUsd).toFixed(2)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
