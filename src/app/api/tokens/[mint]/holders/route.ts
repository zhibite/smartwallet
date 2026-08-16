import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json } from "@/lib/http";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ mint: string }> },
) {
  await requireSession();
  const { mint } = await ctx.params;
  const holdings = await prisma.holding.findMany({
    where: { tokenMint: mint },
    include: { wallet: true },
  });
  return json(holdings);
}
