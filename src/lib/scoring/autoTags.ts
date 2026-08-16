/**
 * 自动标签规则（对应 features.md 3.1.2 系统标签）
 * 数据来自 WalletMetric 聚合 + Trade 表派生
 *
 * 规则可在 /settings/tags 页编辑；这里只是默认定义
 */
export interface WalletBehaviorSnapshot {
  avgHoldingHours?: number;
  winRate?: number;          // 0-1
  newFomoRatio?: number;     // 买入 token 中首日买入占比
  avgBuyUsd?: number;
  holdingCount?: number;
  avgTimeFromLaunchMinutes?: number; // 越低越早期
}

export type AutoTagRule = {
  slug: string;
  name: string;
  description: string;
  match: (s: WalletBehaviorSnapshot) => boolean;
};

export const defaultAutoTagRules: AutoTagRule[] = [
  {
    slug: "short-king",
    name: "短线王",
    description: "平均持仓 < 6h 且胜率 > 60%",
    match: (s) =>
      (s.avgHoldingHours ?? Infinity) < 6 && (s.winRate ?? 0) > 0.6,
  },
  {
    slug: "new-fomo",
    name: "土狗专捡",
    description: "买入 Token 中上线 < 24h 占比 > 70%",
    match: (s) => (s.newFomoRatio ?? 0) > 0.7,
  },
  {
    slug: "blue-chip-holder",
    name: "蓝筹持有者",
    description: "平均买入金额 > 100k USD 且持仓数 < 5",
    match: (s) =>
      (s.avgBuyUsd ?? 0) > 100_000 && (s.holdingCount ?? Infinity) < 5,
  },
  {
    slug: "early-bird",
    name: "早期投资者",
    description: "买入时间在 Token 首发 24h 内的占比 > 50%",
    match: (s) => (s.avgTimeFromLaunchMinutes ?? Infinity) < 24 * 60 / 2,
  },
  {
    slug: "whale",
    name: "巨鲸",
    description: "平均买入金额 > 500k USD",
    match: (s) => (s.avgBuyUsd ?? 0) > 500_000,
  },
];

export function applyAutoTags(s: WalletBehaviorSnapshot): string[] {
  return defaultAutoTagRules.filter((r) => r.match(s)).map((r) => r.slug);
}
