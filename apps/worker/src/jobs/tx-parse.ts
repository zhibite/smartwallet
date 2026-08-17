import type { Job } from "bullmq";
import { prisma } from "@/lib/db";
import { HeliusClient } from "@/lib/solana/helius";
import { queues, QUEUE_NAMES } from "../queue";

const helius = new HeliusClient({
  apiKey: process.env.HELIUS_API_KEY,
  rpcUrl: process.env.HELIUS_RPC_URL,
});

interface ParsePayload {
  walletAddress: string;
  signature: string;
  blockTime: number;
  slot: number;
  err: boolean;
}

/**
 * 解析一条 Helius Enhanced Transaction，落库 trades + holdings + 触发信号检测
 */
export async function txParseHandler(job: Job<ParsePayload>) {
  const { walletAddress, signature, blockTime, slot, err } = job.data;

  const exists = await prisma.trade.findUnique({ where: { txSig: signature } });
  if (exists) {
    console.log(`[tx-parse] ${job.id} skipped (already in DB)`);
    return { skipped: true };
  }

  if (err) {
    console.log(`[tx-parse] ${job.id} skipped (failed on-chain)`);
    return { skipped: true, reason: "tx failed on-chain" };
  }

  let tx;
  try {
    tx = await helius.getTransaction(signature);
  } catch (e) {
    console.error(`[tx-parse] ${job.id} helius getTransaction threw:`, e instanceof Error ? e.message : e);
    throw e;
  }
  if (!tx) {
    console.log(`[tx-parse] ${job.id} skipped (null tx for ${signature.slice(0, 12)}…)`);
    return { skipped: true, reason: "tx not fetchable" };
  }
  console.log(`[tx-parse] ${job.id} got tx ${signature.slice(0, 12)}… type=${tx.type} transfers=${(tx.tokenTransfers ?? []).length}`);

  const transfers = (tx.tokenTransfers ?? []).filter(
    (t) => t.tokenStandard === "Fungible",
  );
  if (transfers.length === 0) return { skipped: true, reason: "no token transfers" };

  // 启发式判定：钱包是 transfer 的 fromUserAccount => SELL；是 toUserAccount => BUY
  for (const tr of transfers) {
    const direction =
      tr.fromUserAccount === walletAddress
        ? "SELL"
        : tr.toUserAccount === walletAddress
          ? "BUY"
          : null;
    if (!direction) continue;

    // 过滤内部转账（同币同向且对手在监控列表）
    if (
      tr.fromUserAccount !== walletAddress &&
      tr.toUserAccount !== walletAddress
    ) {
      continue;
    }

    const mint = tr.mint;
    const amountRaw = tr.tokenAmount * Math.pow(10, tr.decimals ?? 0);

    // upsert token
    await prisma.token.upsert({
      where: { mint },
      create: {
        mint,
        decimals: tr.decimals ?? 0,
        symbol: tr.tokenSymbol ?? null,
        name: tr.tokenName ?? null,
      },
      update: {},
    });

    await prisma.trade.create({
      data: {
        txSig: signature,
        walletAddr: walletAddress,
        tokenMint: mint,
        direction,
        blockTime: new Date(blockTime),
        slot: BigInt(slot),
        tokenAmount: amountRaw.toFixed(0),
        feeLamports: BigInt(tx.fee ?? 0),
        raw: tx as unknown as object,
      },
    });

    // 更新 holding
    const holding = await prisma.holding.findUnique({
      where: { walletAddr_tokenMint: { walletAddr: walletAddress, tokenMint: mint } },
    });
    if (direction === "BUY") {
      await prisma.holding.upsert({
        where: { walletAddr_tokenMint: { walletAddr: walletAddress, tokenMint: mint } },
        create: {
          walletAddr: walletAddress,
          tokenMint: mint,
          amount: amountRaw.toFixed(0),
          remainingAmount: amountRaw.toFixed(0),
          costBasisUsd: "0",
          lastBuyAt: new Date(blockTime),
        },
        update: {
          amount: { increment: amountRaw },
          remainingAmount: { increment: amountRaw },
          lastBuyAt: new Date(blockTime),
        },
      });
    } else {
      if (holding) {
        await prisma.holding.update({
          where: { walletAddr_tokenMint: { walletAddr: walletAddress, tokenMint: mint } },
          data: {
            remainingAmount: { decrement: Math.min(Number(holding.remainingAmount), amountRaw) },
            lastSellAt: new Date(blockTime),
          },
        });
      }
    }
  }

  // trigger consensus detection for this tx
  await queues.signalDetect.add(
    "after-parse",
    { walletAddress, signature, blockTime },
    { removeOnComplete: true },
  );

  return { processed: true };
}
