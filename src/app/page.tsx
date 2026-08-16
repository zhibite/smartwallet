import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  // Admin layout already ensures session; render overview.
  redirect("/");
}
