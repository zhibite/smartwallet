import type { Job } from "bullmq";
import { prisma } from "@/lib/db";
import { HeliusClient } from "@/lib/solana/helius";

const helius = new HeliusClient({
  apiKey: process.env.HELIUS_API_KEY,
  rpcUrl: process.env.HELIUS_RPC_URL,
});

/**
 * 拉取并写入 token 元数据（DAS getAsset）
 */
export async function tokenMetaHandler(job: Job<{ mint: string }>) {
  const { mint } = job.data;
  try {
    const asset = await helius.getAsset(mint);
    await prisma.token.upsert({
      where: { mint },
      create: {
        mint,
        symbol: asset.token_info?.symbol ?? asset.content?.metadata?.symbol ?? null,
        name: asset.content?.metadata?.name ?? null,
        logoUri: asset.content?.metadata?.image ?? null,
        description: asset.content?.metadata?.description ?? null,
        decimals: asset.token_info?.decimals ?? 0,
        totalSupply: asset.token_info?.supply ? String(asset.token_info.supply) : null,
        renouncedMint: asset.renounced ?? false,
      },
      update: {
        symbol: asset.token_info?.symbol ?? asset.content?.metadata?.symbol ?? null,
        name: asset.content?.metadata?.name ?? null,
        logoUri: asset.content?.metadata?.image ?? null,
        description: asset.content?.metadata?.description ?? null,
        decimals: asset.token_info?.decimals ?? 0,
        totalSupply: asset.token_info?.supply ? String(asset.token_info.supply) : null,
        renouncedMint: asset.renounced ?? false,
      },
    });
    return { mint };
  } catch (e) {
    console.error(`[token-meta] ${mint} failed:`, e);
    return { mint, error: e instanceof Error ? e.message : String(e) };
  }
}
