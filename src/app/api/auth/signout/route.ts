import { clearSessionCookie, getSession, recordAudit } from "@/lib/auth";
import { json } from "@/lib/http";

export async function POST() {
  const session = await getSession();
  await clearSessionCookie();
  if (session) await recordAudit(session.uid, "auth.signout");
  return json({ ok: true });
}
