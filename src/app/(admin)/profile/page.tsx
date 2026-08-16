import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your account.
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Username</dt>
            <dd className="mt-1 text-base font-medium text-gray-800 dark:text-white/90">
              {session.username}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Role</dt>
            <dd className="mt-1 text-base font-medium text-gray-800 dark:text-white/90">
              {session.role}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
