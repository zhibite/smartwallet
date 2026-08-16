type Token = {
  mint: string;
  symbol: string | null;
  name: string | null;
  logoUri: string | null;
  priceUsd: string | null;
  mcapUsd: string | null;
  liquidityUsd: string | null;
  smartHolders: number | null;
  priceChange1h: string | null;
  priceChange24h: string | null;
  honeypotRisk: boolean | null;
  riskScore: number | null;
};

export default function TokenTable({ tokens }: { tokens: Token[] }) {
  if (tokens.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tokens yet.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-zinc-700">
          <tr>
            <th className="px-6 py-3">Token</th>
            <th className="px-6 py-3">Price</th>
            <th className="px-6 py-3">1h</th>
            <th className="px-6 py-3">24h</th>
            <th className="px-6 py-3">MCap</th>
            <th className="px-6 py-3">Liquidity</th>
            <th className="px-6 py-3">Smart</th>
            <th className="px-6 py-3">Risk</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.mint} className="border-b border-gray-100 dark:border-zinc-700">
              <td className="px-6 py-4">
                <a
                  href={`/tokens/${t.mint}`}
                  className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                >
                  {t.symbol ?? t.mint.slice(0, 6) + "…"}
                </a>
                {t.name && (
                  <span className="ml-2 text-xs text-gray-400">{t.name}</span>
                )}
              </td>
              <td className="px-6 py-4">
                {t.priceUsd ? `$${Number(t.priceUsd).toFixed(6)}` : "—"}
              </td>
              <td className="px-6 py-4">
                {t.priceChange1h
                  ? `${(Number(t.priceChange1h) * 100).toFixed(2)}%`
                  : "—"}
              </td>
              <td className="px-6 py-4">
                {t.priceChange24h
                  ? `${(Number(t.priceChange24h) * 100).toFixed(2)}%`
                  : "—"}
              </td>
              <td className="px-6 py-4">
                {t.mcapUsd
                  ? `$${Number(t.mcapUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : "—"}
              </td>
              <td className="px-6 py-4">
                {t.liquidityUsd
                  ? `$${Number(t.liquidityUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : "—"}
              </td>
              <td className="px-6 py-4">{t.smartHolders ?? 0}</td>
              <td className="px-6 py-4">
                {t.honeypotRisk === true ? (
                  <span className="rounded-full bg-error-50 px-2 py-0.5 text-xs text-error-700 dark:bg-error-500/10 dark:text-error-400">
                    Honeypot
                  </span>
                ) : t.riskScore != null ? (
                  <span className="text-xs">{t.riskScore}/100</span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
