import { z } from "zod";
import { requireAdmin, recordAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, json } from "@/lib/http";

const schema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "VIEWER"]).default("VIEWER"),
  displayName: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const session = await requireAdmin();
  try {
    const data = schema.parse(await req.json());
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        role: data.role,
        displayName: data.displayName ?? null,
      },
    });
    await recordAudit(session.uid, "user.create", user.id);
    return json({ id: user.id, username: user.username, role: user.role });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.message, 400);
    if (e instanceof Error && e.message.includes("Unique")) {
      return fail("Username already taken", 409);
    }
    return fail(e instanceof Error ? e.message : "Create failed", 500);
  }
}

export async function GET() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return json(users);
}
