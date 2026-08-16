import { requireAdmin, recordAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json } from "@/lib/http";

export async function POST() {
  const session = await requireAdmin();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - 7);
  const key = weekStart.toISOString().slice(0, 10);

  const report = await prisma.report.create({
    data: {
      kind: "weekly",
      subjectKey: key,
      status: "PENDING",
    },
  });
  await recordAudit(session.uid, "report.generate", report.id, { kind: "weekly" });
  return json(report);
}
