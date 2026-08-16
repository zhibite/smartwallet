import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json } from "@/lib/http";

export async function GET() {
  const session = await requireSession();
  const alerts = await prisma.alertConfig.findMany({
    where: { userId: session.uid },
    orderBy: { createdAt: "desc" },
  });
  return json(alerts);
}
