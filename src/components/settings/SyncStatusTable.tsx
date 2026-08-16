import dayjs from "dayjs";

type Row = {
  walletAddress: string;
  label: string | null;
  status: string;
  lastSyncedAt: string | null;
  lagSeconds: number | null;
  errorMessage: string | null;
  updatedAt: string;
};

export default function SyncStatusTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No sync status recorded yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-zinc-700">
          <tr>
            <th className="py-2">Wallet</th>
            <th className="py-2">Status</th>
            <th className="py-2">Last Synced</th>
            <th className="py-2">Lag (s)</th>
            <th className="py-2">Error</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.walletAddress}
              className="border-b border-gray-100 dark:border-zinc-700"
            >
              <td className="py-3 font-mono text-xs">
                {r.label ?? `${r.walletAddress.slice(0, 6)}…${r.walletAddress.slice(-4)}`}
              </td>
              <td className="py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.status === "OK"
                      ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                      : r.status === "ERROR"
                        ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                        : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="py-3 text-xs text-gray-500">
                {r.lastSyncedAt ? dayjs(r.lastSyncedAt).format("YYYY-MM-DD HH:mm:ss") : "—"}
              </td>
              <td className="py-3 text-xs">{r.lagSeconds ?? "—"}</td>
              <td className="py-3 text-xs text-error-500">{r.errorMessage ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
