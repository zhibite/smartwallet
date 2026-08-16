type Stat = {
  label: string;
  value: string | number;
  hint?: string;
};

function format(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function OverviewMetrics({
  walletsTotal,
  walletsEnabled,
  tokensTracked,
  signals24h,
}: {
  walletsTotal: number;
  walletsEnabled: number;
  tokensTracked: number;
  signals24h: number;
}) {
  const stats: Stat[] = [
    {
      label: "Smart Money Wallets",
      value: `${format(walletsEnabled)} / ${format(walletsTotal)}`,
      hint: "enabled / total",
    },
    {
      label: "Tracked Tokens",
      value: format(tokensTracked),
    },
    {
      label: "Signals (24h)",
      value: format(signals24h),
    },
    {
      label: "Data Quality",
      value: "—",
      hint: "computed nightly",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-800 dark:text-white/90">
            {s.value}
          </p>
          {s.hint && (
            <p className="mt-1 text-xs text-gray-400">{s.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}
