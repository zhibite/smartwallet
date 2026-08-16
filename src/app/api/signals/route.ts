import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json } from "@/lib/http";

export async function GET() {
  await requireSession();
  const signals = await prisma.signal.findMany({
    orderBy: { detectedAt: "desc" },
    take: 100,
    include: { token: true },
  });
  return json(signals);
}
