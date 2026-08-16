import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json } from "@/lib/http";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ mint: string }> },
) {
  await requireSession();
  const { mint } = await ctx.params;
  const points = await prisma.pricePoint.findMany({
    where: { tokenMint: mint },
    orderBy: { ts: "asc" },
    take: 500,
  });
  return json(points);
}
