import cron from "node-cron";
import { queues, QUEUE_NAMES } from "./queue";

export function startScheduler() {
  // 30s tx-sync
  cron.schedule("*/30 * * * * *", () => {
    queues.txSync.add("tick", { now: Date.now() }, { removeOnComplete: true });
  });
  // 5min token-snapshot
  cron.schedule("*/5 * * * *", () => {
    queues.tokenSnapshot.add("tick", { now: Date.now() }, { removeOnComplete: true });
  });
  // 04:00 UTC daily PnL recompute
  cron.schedule("0 4 * * *", () => {
    queues.pnlRecompute.add("nightly", {}, { removeOnComplete: true });
  });
  // 05:00 UTC tag engine
  cron.schedule("0 5 * * *", () => {
    queues.tagEngine.add("nightly", {}, { removeOnComplete: true });
  });
  // Monday 06:00 UTC weekly report
  cron.schedule("0 6 * * 1", () => {
    queues.reportGenerate.add("weekly", {}, { removeOnComplete: true });
  });
  // 1st of month 06:00 UTC monthly report
  cron.schedule("0 6 1 * *", () => {
    queues.reportGenerate.add("monthly", {}, { removeOnComplete: true });
  });
  console.log("[scheduler] cron registered");
  console.log(`  - ${QUEUE_NAMES.txSync}: every 30s`);
  console.log(`  - ${QUEUE_NAMES.tokenSnapshot}: every 5min`);
  console.log(`  - ${QUEUE_NAMES.pnlRecompute}: 04:00 UTC daily`);
  console.log(`  - ${QUEUE_NAMES.tagEngine}: 05:00 UTC daily`);
  console.log(`  - ${QUEUE_NAMES.reportGenerate}: Mon + 1st 06:00 UTC`);
}
