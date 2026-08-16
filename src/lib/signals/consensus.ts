import dayjs from "dayjs";

export interface ConsensusInput {
  tokenMint: string;
  timestamp: Date;       // 成交发生时间
  walletAddress: string;
  direction: "BUY" | "SELL";
  usdAmount: number;     // 估计成交金额（USD）
}

export interface ConsensusDetected {
  tokenMint: string;
  wallets: string[];
  totalUsd: number;
  count: number;
  windowStart: Date;
  windowEnd: Date;
  strength: number; // = count * totalUsd / hours
}

export interface ConsensusConfig {
  windowMinutes: number;
  minWallets: number;
  minUsdTotal: number;
}

/**
 * 滑动窗口共识检测：
 * 把同 tokenMint 的 buy 按时间排序后跑滑动窗口，
 * 每命中条件输出一个共识事件。
 */
export function detectConsensus(
  trades: ConsensusInput[],
  cfg: ConsensusConfig = { windowMinutes: 60, minWallets: 3, minUsdTotal: 50_000 },
): ConsensusDetected[] {
  const result: ConsensusDetected[] = [];
  const buys = trades
    .filter((t) => t.direction === "BUY")
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // 按 tokenMint 分桶
  const byToken = new Map<string, ConsensusInput[]>();
  for (const t of buys) {
    const arr = byToken.get(t.tokenMint) ?? [];
    arr.push(t);
    byToken.set(t.tokenMint, arr);
  }

  for (const [mint, list] of byToken) {
    if (list.length < cfg.minWallets) continue;
    let i = 0;
    while (i < list.length) {
      const j = i;
      const wallets = new Set<string>();
      let totalUsd = 0;
      while (j < list.length) {
        const elapsedMin =
          (list[j].timestamp.getTime() - list[i].timestamp.getTime()) / 60_000;
        if (elapsedMin > cfg.windowMinutes) break;
        wallets.add(list[j].walletAddress);
        totalUsd += list[j].usdAmount;
        if (wallets.size >= cfg.minWallets && totalUsd >= cfg.minUsdTotal) {
          const hours = Math.max(elapsedMin / 60, 0.25);
          result.push({
            tokenMint: mint,
            wallets: Array.from(wallets),
            totalUsd,
            count: wallets.size,
            windowStart: list[i].timestamp,
            windowEnd: list[j].timestamp,
            strength: Math.round((wallets.size * totalUsd) / hours),
          });
          break;
        }
      }
      i++;
    }
  }
  return result;
}

export function windowBucketKey(ts: Date, _windowMinutes: number) {
  return dayjs(ts).startOf("minute").format(`YYYY-MM-DD HH:mm`);
}
