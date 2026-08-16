import { requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json } from "@/lib/http";

export async function POST() {
  const session = await requireAdmin();
  await recordAudit(session.uid, "system.jobs.recompute-all");
  // Enqueue recompute jobs (worker handles)
  await prisma.report.create({
    data: {
      kind: "manual_recompute",
      subjectKey: "all",
      status: "PENDING",
    },
  });
  return json({ ok: true });
}
