import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminShell from "@/layout/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }
  return <AdminShell>{children}</AdminShell>;
}
