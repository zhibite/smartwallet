import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SettingsNav from "@/components/settings/SettingsNav";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Admin only. Configure sync, quotas, alert rules, and users.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <SettingsNav />
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
