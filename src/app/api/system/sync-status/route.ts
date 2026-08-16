import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json } from "@/lib/http";

export async function GET() {
  await requireAdmin();
  const status = await prisma.syncStatus.findMany({
    include: { wallet: true },
    orderBy: { updatedAt: "desc" },
  });
  return json(status);
}
