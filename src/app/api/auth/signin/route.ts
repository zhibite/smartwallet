import { z } from "zod";
import { authenticate, setSessionCookie, recordAudit } from "@/lib/auth";
import { fail, json } from "@/lib/http";

const schema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid credentials payload", 400);
  }
  try {
    const user = await authenticate(parsed.data.username, parsed.data.password);
    await setSessionCookie({ uid: user.id, username: user.username, role: user.role });
    await recordAudit(user.id, "auth.signin");
    return json({ uid: user.id, username: user.username, role: user.role });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Auth failed";
    return fail(msg, 401);
  }
}
