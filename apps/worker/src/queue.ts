import { Queue, type QueueOptions } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let connection: IORedis | null = null;

export function getRedis(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

const defaultOpts: QueueOptions = {
  connection: getRedis(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
};

export const queues = {
  txSync: new Queue("tx-sync", defaultOpts),
  txParse: new Queue("tx-parse", defaultOpts),
  tokenSnapshot: new Queue("token-snapshot", defaultOpts),
  tokenMeta: new Queue("token-meta", defaultOpts),
  signalDetect: new Queue("signal-detect", defaultOpts),
  pnlRecompute: new Queue("pnl-recompute", defaultOpts),
  tagEngine: new Queue("tag-engine", defaultOpts),
  alertDispatch: new Queue("alert-dispatch", defaultOpts),
  reportGenerate: new Queue("report-generate", defaultOpts),
};

export const QUEUE_NAMES = {
  txSync: "tx-sync",
  txParse: "tx-parse",
  tokenSnapshot: "token-snapshot",
  tokenMeta: "token-meta",
  signalDetect: "signal-detect",
  pnlRecompute: "pnl-recompute",
  tagEngine: "tag-engine",
  alertDispatch: "alert-dispatch",
  reportGenerate: "report-generate",
} as const;
