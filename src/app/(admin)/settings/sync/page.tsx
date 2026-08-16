import { prisma } from "@/lib/db";
import SyncStatusTable from "@/components/settings/SyncStatusTable";

export const dynamic = "force-dynamic";

export default async function SettingsSyncPage() {
  const status = await prisma.syncStatus.findMany({
    include: { wallet: true },
    orderBy: { updatedAt: "desc" },
  });
  const rows = status.map((s) => ({
    walletAddress: s.walletAddress,
    label: s.wallet.label,
    status: s.status,
    lastSyncedAt: s.lastSyncedAt?.toISOString() ?? null,
    lagSeconds: s.lagSeconds,
    errorMessage: s.errorMessage,
    updatedAt: s.updatedAt.toISOString(),
  }));
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Wallet Sync Status
      </h2>
      <SyncStatusTable rows={rows} />
    </div>
  );
}
