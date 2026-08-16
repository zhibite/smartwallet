import Link from "next/link";

type Token = {
  mint: string;
  symbol: string | null;
  name: string | null;
  smartHolders: number | null;
  mcapUsd: string | null;
  priceChange1h: string | null;
};

export default function HotTokensTop10({ tokens }: { tokens: Token[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800 lg:col-span-2">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Hot Tokens (by Smart Holders)
      </h2>
      {tokens.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tokens tracked yet. Worker will populate this list as smart money wallets trade.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-zinc-700">
              <tr>
                <th className="py-2">Token</th>
                <th className="py-2">Smart</th>
                <th className="py-2">MCap</th>
                <th className="py-2">1h</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr
                  key={t.mint}
                  className="border-b border-gray-100 dark:border-zinc-700"
                >
                  <td className="py-3">
                    <Link
                      href={`/tokens/${t.mint}`}
                      className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                    >
                      {t.symbol ?? t.mint.slice(0, 6) + "…"}
                    </Link>
                    {t.name && (
                      <span className="ml-2 text-xs text-gray-400">
                        {t.name}
                      </span>
                    )}
                  </td>
                  <td className="py-3">{t.smartHolders ?? 0}</td>
                  <td className="py-3">
                    {t.mcapUsd
                      ? `$${Number(t.mcapUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : "—"}
                  </td>
                  <td className="py-3">
                    {t.priceChange1h
                      ? `${(Number(t.priceChange1h) * 100).toFixed(2)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
