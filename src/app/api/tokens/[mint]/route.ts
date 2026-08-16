import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, json } from "@/lib/http";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ mint: string }> },
) {
  await requireSession();
  const { mint } = await ctx.params;
  const token = await prisma.token.findUnique({ where: { mint } });
  if (!token) return fail("Not found", 404);
  return json(token);
}
