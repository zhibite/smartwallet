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

  // 用 Helius Parse Transactions REST endpoint 一次性批量解析（type / tokenTransfers）
  let parsed: Array<{ signature: string; type?: string; tokenTransfers?: unknown[] }>;
  try {
    parsed = await helius.parseTransactions([signature]);
  } catch (e) {
    console.error(`[tx-parse] ${job.id} parseTransactions threw:`, e instanceof Error ? e.message : e);
    throw e;
  }
  const tx = parsed[0];
  if (!tx) {
    console.log(`[tx-parse] ${job.id} skipped (parse returned empty for ${signature.slice(0, 12)}…)`);
    return { skipped: true, reason: "tx not fetchable" };
  }
  console.log(`[tx-parse] ${job.id} got tx ${signature.slice(0, 12)}… type=${tx.type ?? "?"} transfers=${(tx.tokenTransfers ?? []).length}`);

  // parsed[0] 是 Helius Enhanced Transaction 格式：type / tokenTransfers / fee / ...
  const txAny = tx as unknown as {
    fee?: number;
    tokenTransfers?: Array<{
      tokenStandard?: string;
      mint: string;
      tokenAmount: number;
      decimals?: number;
      tokenSymbol?: string;
      tokenName?: string;
      fromUserAccount: string;
      toUserAccount: string;
    }>;
  };
  const transfers = (txAny.tokenTransfers ?? []).filter(
    (t) => t.tokenStandard === "Fungible",
  );
  if (transfers.length === 0) return { skipped: true, reason: "no token transfers" };

  // 启发式判定：钱包是 transfer 的 fromUserAccount => SELL；是 toUserAccount => BUY
  // 一个 swap 通常有多个 leg（SOL↔token, 路由, 手续费），按 mint 聚合净流量；
  // 净 in > 0 => BUY，净 out > 0 => SELL，0 => 跳过。
  // 一笔 tx = 一个 trade，按 mint 分别落库。
  const grouped = new Map<
    string,
    { tr: (typeof transfers)[number]; netRaw: number; direction: "BUY" | "SELL" }
  >();

  for (const tr of transfers) {
    const mint = tr.mint;
    // Helius Enhanced transaction 的 tokenAmount 已经是 UI 单位（不是 raw lamports）
    const raw = tr.tokenAmount;
    let entry = grouped.get(mint);
    if (!entry) {
      entry = { tr, netRaw: 0, direction: tr.toUserAccount === walletAddress ? "BUY" : "SELL" };
      grouped.set(mint, entry);
    }
    if (tr.toUserAccount === walletAddress) entry.netRaw += raw;
    if (tr.fromUserAccount === walletAddress) entry.netRaw -= raw;
  }

  // 一个 tx 仅产一笔 trade：取净流量绝对值最大的 mint 作为本笔主 trade
  let primary: { tr: (typeof transfers)[number]; netRaw: number; direction: "BUY" | "SELL" } | null = null;
  for (const entry of grouped.values()) {
    if (entry.netRaw === 0) continue;
    if (!primary || Math.abs(entry.netRaw) > Math.abs(primary.netRaw)) {
      primary = entry;
    }
  }
  if (!primary) return { skipped: true, reason: "no net flow" };

  const involvedList = [primary];

  for (const entry of involvedList) {
    const tr = entry.tr;
    const direction = entry.direction;
    const mint = tr.mint;
    const amountRaw = Math.abs(entry.netRaw);

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
        tokenAmount: amountRaw.toString(),
        feeLamports: BigInt(txAny.fee ?? 0),
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
          amount: amountRaw.toString(),
          remainingAmount: amountRaw.toString(),
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
