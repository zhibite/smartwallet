type Data = {
  mint: string;
  symbol: string | null;
  name: string | null;
  logoUri: string | null;
  decimals: number;
  priceUsd: string | null;
  priceChange1h: string | null;
  priceChange24h: string | null;
  priceChange7d: string | null;
  mcapUsd: string | null;
  liquidityUsd: string | null;
  holdersCount: number | null;
  smartHolders: number | null;
  honeypotRisk: boolean | null;
  riskScore: number | null;
  deployer: string | null;
  renouncedMint: boolean;
  firstSeenAt: string;
};

function pct(v: string | null, digits = 2) {
  if (!v) return "—";
  return `${(Number(v) * 100).toFixed(digits)}%`;
}

export default function TokenHeader({ data }: { data: Data }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {data.logoUri && (
            <img
              src={data.logoUri}
              alt={data.symbol ?? data.mint}
              className="h-12 w-12 rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {data.symbol ?? data.mint.slice(0, 6) + "…"}
              {data.name && (
                <span className="ml-2 text-base font-normal text-gray-500">
                  {data.name}
                </span>
              )}
            </h1>
            <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
              {data.mint}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {data.honeypotRisk === true && (
                <span className="rounded-full bg-error-50 px-2 py-0.5 text-error-700 dark:bg-error-500/10 dark:text-error-400">
                  Honeypot risk
                </span>
              )}
              {data.renouncedMint && (
                <span className="rounded-full bg-success-50 px-2 py-0.5 text-success-700 dark:bg-success-500/10 dark:text-success-400">
                  Mint Renounced
                </span>
              )}
              {data.smartHolders != null && data.smartHolders > 0 && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {data.smartHolders} smart holders
                </span>
              )}
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Price</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {data.priceUsd ? `$${Number(data.priceUsd).toFixed(6)}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">1h</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {pct(data.priceChange1h)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">24h</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {pct(data.priceChange24h)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">7d</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {pct(data.priceChange7d)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">MCap</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {data.mcapUsd
                ? `$${Number(data.mcapUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Liquidity</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {data.liquidityUsd
                ? `$${Number(data.liquidityUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Holders</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {data.holdersCount?.toLocaleString() ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Risk</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {data.riskScore != null ? `${data.riskScore}/100` : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
