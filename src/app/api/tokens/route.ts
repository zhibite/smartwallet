import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json } from "@/lib/http";

export async function GET() {
  await requireSession();
  const tokens = await prisma.token.findMany({
    orderBy: { smartHolders: { sort: "desc", nulls: "last" } },
    take: 200,
  });
  return json(tokens);
}
