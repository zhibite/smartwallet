import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireSession, recordAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, json } from "@/lib/http";

const schema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  scope: z.enum(["wallet", "token"]),
  criteria: z.record(z.string(), z.unknown()),
});

export async function GET() {
  const session = await requireSession();
  const queries = await prisma.savedQuery.findMany({
    where: { userId: session.uid },
    orderBy: { createdAt: "desc" },
  });
  return json(queries);
}

export async function POST(req: Request) {
  const session = await requireSession();
  try {
    const data = schema.parse(await req.json());
    const q = await prisma.savedQuery.create({
      data: {
        ...data,
        criteria: data.criteria as Prisma.InputJsonValue,
        userId: session.uid,
      },
    });
    await recordAudit(session.uid, "query.create", q.id);
    return json(q);
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.message, 400);
    return fail(e instanceof Error ? e.message : "Save failed", 500);
  }
}
