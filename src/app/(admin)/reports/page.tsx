import { prisma } from "@/lib/db";
import ReportsList from "@/components/reports/ReportsList";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const rows = reports.map((r) => ({
    id: r.id,
    kind: r.kind,
    subjectKey: r.subjectKey,
    status: r.status,
    sizeBytes: r.sizeBytes,
    generatedAt: r.generatedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    errorMessage: r.errorMessage,
  }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Reports
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Weekly and monthly performance reports.
        </p>
      </div>
      <ReportsList reports={rows} />
    </div>
  );
}
