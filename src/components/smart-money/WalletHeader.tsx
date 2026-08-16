type Tag = {
  slug: string;
  name: string;
  category: string;
  source: string;
};

type Sync = {
  status: string;
  lastSyncedAt: string | null;
  lagSeconds: number | null;
} | null;

type Metrics = {
  winRate: string | null;
  roi30d: string | null;
  pnl30dUsd: string | null;
  realizedPnlUsd: string | null;
  avgHoldingHours: string | null;
  tradesCount: number;
  winningTradesCount: number;
} | null;

type Data = {
  address: string;
  label: string | null;
  source: string | null;
  enabled: boolean;
  trustScore: number | null;
  notes: string | null;
  tags: Tag[];
  sync: Sync;
  metrics: Metrics;
};

function pct(v: string | null, digits = 1) {
  if (!v) return "—";
  return `${(Number(v) * 100).toFixed(digits)}%`;
}

function usd(v: string | null) {
  if (!v) return "—";
  const n = Number(v);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function WalletHeader({ data }: { data: Data }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {data.label ?? "Unlabeled Wallet"}
          </h1>
          <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
            {data.address}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.tags.map((t) => (
              <span
                key={t.slug}
                className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
              >
                {t.name}
              </span>
            ))}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                data.enabled
                  ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                  : "bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-400"
              }`}
            >
              {data.enabled ? "Active" : "Disabled"}
            </span>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">30d PnL</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {usd(data.metrics?.pnl30dUsd ?? null)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">ROI 30d</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {pct(data.metrics?.roi30d ?? null)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Win Rate</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {pct(data.metrics?.winRate ?? null)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Avg Hold</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {data.metrics?.avgHoldingHours
                ? `${Number(data.metrics.avgHoldingHours).toFixed(1)}h`
                : "—"}
            </dd>
          </div>
        </dl>
      </div>
      {data.sync && (
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Sync:</span>
          <span
            className={`rounded-full px-2 py-0.5 ${
              data.sync.status === "OK"
                ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
            }`}
          >
            {data.sync.status}
          </span>
          {data.sync.lastSyncedAt && (
            <span>last at {new Date(data.sync.lastSyncedAt).toLocaleString()}</span>
          )}
          {data.sync.lagSeconds != null && (
            <span>· lag {data.sync.lagSeconds}s</span>
          )}
        </div>
      )}
    </div>
  );
}
