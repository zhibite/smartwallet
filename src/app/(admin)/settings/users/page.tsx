import { prisma } from "@/lib/db";
import UsersTable from "@/components/settings/UsersTable";

export const dynamic = "force-dynamic";

export default async function SettingsUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  const rows = users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    displayName: u.displayName,
    enabled: u.enabled,
    createdAt: u.createdAt.toISOString(),
  }));
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Users
      </h2>
      <UsersTable users={rows} />
    </div>
  );
}
