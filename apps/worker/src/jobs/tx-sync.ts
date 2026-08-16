import type { Job } from "bullmq";
import { prisma } from "@/lib/db";
import { HeliusClient } from "@/lib/solana/helius";
import { queues, QUEUE_NAMES } from "../queue";

const helius = new HeliusClient({
  apiKey: process.env.HELIUS_API_KEY,
  rpcUrl: process.env.HELIUS_RPC_URL,
});

export async function txSyncHandler(job: Job) {
  const wallets = await prisma.wallet.findMany({
    where: { enabled: true },
    select: { address: true },
  });
  for (const w of wallets) {
    try {
      const status = await prisma.syncStatus.findUnique({
        where: { walletAddress: w.address },
      });
      const sigs = await helius.getSignaturesForAddress(w.address, { limit: 100 });
      if (sigs.length === 0) continue;
      const lastSig = sigs[sigs.length - 1]?.signature ?? null;
      // enqueue parse for each tx
      for (const s of sigs) {
        await queues.txParse.add(
          "parse",
          {
            walletAddress: w.address,
            signature: s.signature,
            blockTime: s.blockTime ? s.blockTime * 1000 : Date.now(),
            slot: s.slot,
            err: !!s.err,
          },
          { removeOnComplete: true },
        );
      }
      await prisma.syncStatus.upsert({
        where: { walletAddress: w.address },
        create: {
          walletAddress: w.address,
          lastSyncedSignature: lastSig,
          lastSyncedAt: new Date(),
          status: "OK",
        },
        update: {
          lastSyncedSignature: lastSig,
          lastSyncedAt: new Date(),
          status: "OK",
          errorMessage: null,
        },
      });
    } catch (e) {
      await prisma.syncStatus.update({
        where: { walletAddress: w.address },
        data: {
          status: "ERROR",
          errorMessage: e instanceof Error ? e.message : String(e),
        },
      }).catch(() => {});
      console.error(`[tx-sync] wallet ${w.address} failed:`, e);
    }
  }
  return { wallets: wallets.length, ranAt: new Date().toISOString() };
}
