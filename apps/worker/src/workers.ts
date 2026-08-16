import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, getRedis } from "./queue";
import { txSyncHandler } from "./jobs/tx-sync";
import { txParseHandler } from "./jobs/tx-parse";
import { tokenSnapshotHandler } from "./jobs/token-snapshot";
import { tokenMetaHandler } from "./jobs/token-meta";
import { signalDetectHandler } from "./jobs/signal-detect";
import { pnlRecomputeHandler } from "./jobs/pnl-recompute";
import { tagEngineHandler } from "./jobs/tag-engine";
import { alertDispatchHandler } from "./jobs/alert-dispatch";
import { reportGenerateHandler } from "./jobs/report-generate";

const connection = getRedis();

export function startWorkers() {
  const workers: Worker[] = [
    new Worker(QUEUE_NAMES.txSync, (j) => txSyncHandler(j), { connection, concurrency: 5 }),
    new Worker(QUEUE_NAMES.txParse, (j) => txParseHandler(j), { connection, concurrency: 8 }),
    new Worker(QUEUE_NAMES.tokenSnapshot, (j) => tokenSnapshotHandler(j), { connection, concurrency: 2 }),
    new Worker(QUEUE_NAMES.tokenMeta, (j) => tokenMetaHandler(j), { connection, concurrency: 4 }),
    new Worker(QUEUE_NAMES.signalDetect, (j) => signalDetectHandler(j), { connection, concurrency: 2 }),
    new Worker(QUEUE_NAMES.pnlRecompute, (j) => pnlRecomputeHandler(j), { connection, concurrency: 1 }),
    new Worker(QUEUE_NAMES.tagEngine, (j) => tagEngineHandler(j), { connection, concurrency: 1 }),
    new Worker(QUEUE_NAMES.alertDispatch, (j) => alertDispatchHandler(j), { connection, concurrency: 4 }),
    new Worker(QUEUE_NAMES.reportGenerate, (j) => reportGenerateHandler(j), { connection, concurrency: 1 }),
  ];

  for (const w of workers) {
    w.on("ready", () => {
      console.log(`[worker] ${w.name} ready`);
    });
    w.on("failed", (job, err) => {
      console.error(`[worker] ${w.name} job ${job?.id} failed:`, err.message);
    });
  }
  return workers;
}

export type AnyJob = Job<unknown>;
