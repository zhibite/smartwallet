/**
 * FIFO PnL 计算
 * - buy: 向 lot 队列尾部推入 (amount, cost_basis)
 * - sell: 从队列头拿出，先入先出，差价为 realized PnL
 */
export interface PnlLot {
  amount: number;     // 剩余数量
  costPerUnit: number;
  acquiredAt: Date;
}

export interface RealizedPnlEvent {
  soldAmount: number;
  buyLotId: number;
  buyCostPerUnit: number;
  sellPricePerUnit: number;
  pnl: number;
}

export interface FifoState {
  lots: PnlLot[];
  realized: number;
  events: RealizedPnlEvent[];
}

export function createFifoState(): FifoState {
  return { lots: [], realized: 0, events: [] };
}

/**
 * 处理一次成交，返回更新后的 state
 *  - 买入：amount>0
 *  - 卖出：amount<0, pricePerUnit 为卖出单价
 */
export function applyFill(
  state: FifoState,
  fill: { amount: number; pricePerUnit: number; at: Date },
): FifoState {
  const next: FifoState = {
    lots: state.lots.map((l) => ({ ...l })),
    realized: state.realized,
    events: state.events.slice(),
  };

  if (fill.amount >= 0) {
    // BUY
    next.lots.push({
      amount: fill.amount,
      costPerUnit: fill.pricePerUnit,
      acquiredAt: fill.at,
    });
    return next;
  }

  // SELL
  let remaining = -fill.amount;
  while (remaining > 0 && next.lots.length > 0) {
    const head = next.lots[0];
    const take = Math.min(head.amount, remaining);
    const pnl = take * (fill.pricePerUnit - head.costPerUnit);
    next.realized += pnl;
    next.events.push({
      soldAmount: take,
      buyLotId: 0, // 占位，业务层可用 wallet 级全局递增
      buyCostPerUnit: head.costPerUnit,
      sellPricePerUnit: fill.pricePerUnit,
      pnl,
    });
    head.amount -= take;
    remaining -= take;
    if (head.amount <= 1e-12) next.lots.shift();
  }
  return next;
}

export function holdingAmount(state: FifoState): number {
  return state.lots.reduce((s, l) => s + l.amount, 0);
}

export function costBasis(state: FifoState): number {
  return state.lots.reduce((s, l) => s + l.amount * l.costPerUnit, 0);
}

export function unrealizedPnl(state: FifoState, currentPrice: number): number {
  const qty = holdingAmount(state);
  return qty * (currentPrice - costBasis(state) / Math.max(qty, 1e-12));
}
