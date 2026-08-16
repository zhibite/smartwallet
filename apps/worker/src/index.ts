import "dotenv/config";
import http from "node:http";
import { startWorkers } from "./workers";
import { startScheduler } from "./scheduler";

console.log("[worker] starting...");
startWorkers();
startScheduler();

const HEALTH_PORT = Number(process.env.WORKER_HEALTH_PORT ?? 3002);
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, uptime: process.uptime() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});
server.listen(HEALTH_PORT, "0.0.0.0", () => {
  console.log(`[worker] health endpoint :${HEALTH_PORT}/health`);
});

console.log("[worker] up");

const shutdown = async (signal: string) => {
  console.log(`[worker] received ${signal}, exiting...`);
  server.close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
