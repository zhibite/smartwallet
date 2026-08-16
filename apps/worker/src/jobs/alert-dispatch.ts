import type { Job } from "bullmq";
import { prisma } from "@/lib/db";

interface DispatchPayload {
  signalType: string;
  tokenMint: string;
  strength: number;
}

/**
 * 派发信号到用户的告警渠道
 */
export async function alertDispatchHandler(job: Job<DispatchPayload>) {
  const { signalType, tokenMint, strength } = job.data;
  const alerts = await prisma.alertConfig.findMany({ where: { enabled: true } });
  for (const a of alerts) {
    const rules = (a.rules as Record<string, unknown>) ?? {};
    if (rules.signalType && rules.signalType !== signalType) continue;
    if (typeof rules.minStrength === "number" && strength < rules.minStrength) continue;
    if (a.quietUntil && new Date(a.quietUntil) > new Date()) {
      await prisma.alertLog.create({
        data: { alertId: a.id, status: "SKIPPED", payload: { reason: "quiet" } },
      });
      continue;
    }
    try {
      if (a.channel === "TELEGRAM") {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) continue;
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: a.target,
            text: `[${signalType}] ${tokenMint}\nstrength: ${strength}`,
          }),
        });
        await prisma.alertLog.create({
          data: {
            alertId: a.id,
            status: res.ok ? "SENT" : "FAILED",
            payload: { tokenMint, strength },
            errorMessage: res.ok ? null : `HTTP ${res.status}`,
          },
        });
      } else if (a.channel === "WEBHOOK") {
        const res = await fetch(a.target, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signalType, tokenMint, strength, ts: new Date().toISOString() }),
        });
        await prisma.alertLog.create({
          data: {
            alertId: a.id,
            status: res.ok ? "SENT" : "FAILED",
            payload: { tokenMint, strength },
            errorMessage: res.ok ? null : `HTTP ${res.status}`,
          },
        });
      }
    } catch (e) {
      await prisma.alertLog.create({
        data: {
          alertId: a.id,
          status: "FAILED",
          payload: { tokenMint, strength },
          errorMessage: e instanceof Error ? e.message : String(e),
        },
      });
    }
  }
  return { alerts: alerts.length };
}
