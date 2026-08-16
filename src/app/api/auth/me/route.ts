import { getSession } from "@/lib/auth";
import { json } from "@/lib/http";

export async function GET() {
  const s = await getSession();
  return json({
    user: s
      ? { uid: s.uid, username: s.username, role: s.role }
      : null,
  });
}
