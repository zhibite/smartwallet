import dayjs from "dayjs";

type Report = {
  id: string;
  kind: string;
  subjectKey: string;
  status: string;
  sizeBytes: number | null;
  generatedAt: string | null;
  createdAt: string;
  errorMessage: string | null;
};

export default function ReportsList({ reports }: { reports: Report[] }) {
  return (
    <div className="space-y-4">
      <form
        action="/api/reports/generate"
        method="post"
        className="flex items-center justify-end"
      >
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate Weekly Report
        </button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3">Kind</th>
              <th className="px-6 py-3">Subject</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Generated</th>
              <th className="px-6 py-3">Size</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                  No reports yet.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-100 dark:border-zinc-700"
                >
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {dayjs(r.createdAt).format("YYYY-MM-DD HH:mm")}
                  </td>
                  <td className="px-6 py-4">{r.kind}</td>
                  <td className="px-6 py-4 font-mono text-xs">{r.subjectKey}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.status === "DONE"
                          ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                          : r.status === "FAILED"
                            ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                            : "bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-400"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {r.generatedAt ? dayjs(r.generatedAt).format("YYYY-MM-DD HH:mm") : "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {r.sizeBytes ? `${(r.sizeBytes / 1024).toFixed(1)} KB` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
