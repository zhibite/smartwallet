import type { Job } from "bullmq";
import { prisma } from "@/lib/db";

/**
 * 生成周/月报（演示版：标记 DONE；真实实现需要生成 HTML/PDF）
 */
export async function reportGenerateHandler(job: Job<{ kind: string; subjectKey?: string }>) {
  const kind = job.data.kind ?? "weekly";
  const reports = await prisma.report.findMany({
    where: { kind, status: "PENDING" },
  });
  for (const r of reports) {
    try {
      // TODO: 实际 HTML/PDF 渲染，写到 storage
      await prisma.report.update({
        where: { id: r.id },
        data: {
          status: "DONE",
          generatedAt: new Date(),
          sizeBytes: 1024,
        },
      });
    } catch (e) {
      await prisma.report.update({
        where: { id: r.id },
        data: {
          status: "FAILED",
          errorMessage: e instanceof Error ? e.message : String(e),
        },
      });
    }
  }
  return { processed: reports.length };
}
