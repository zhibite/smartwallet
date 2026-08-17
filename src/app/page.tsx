import { getSession } from "@/lib/auth";
import AdminShell from "@/layout/AdminShell";
import AuthSection from "@/components/auth/AuthSection";
import Overview from "@/components/overview/Overview";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await getSession();
  if (!session) {
    return <AuthSection />;
  }
  return (
    <AdminShell>
      <Overview />
    </AdminShell>
  );
}
