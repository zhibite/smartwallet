import { z } from "zod";
import { requireSession, recordAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, json } from "@/lib/http";

const schema = z.object({
  url: z.string().url(),
  tokens: z.array(z.object({ mint: z.string(), symbol: z.string().nullable().optional() })).min(1).max(500),
});

export async function POST(req: Request) {
  const session = await requireSession();
  try {
    const { url, tokens } = schema.parse(await req.json());
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens, source: "smartwallet", generatedAt: new Date().toISOString() }),
    });
    await recordAudit(session.uid, "follow-output.push", url, {
      count: tokens.length,
      status: res.status,
    });
    if (!res.ok) return fail(`Webhook returned ${res.status}`, 502);
    return json({ pushed: tokens.length });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.message, 400);
    return fail(e instanceof Error ? e.message : "Push failed", 500);
  }
}
