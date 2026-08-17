/**
 * Helius RPC client 极简封装
 * - Enhanced Transactions API (getTransactionsForAddress)
 * - DAS API  getAsset / getAssetsByOwner
 * - getSignaturesForAddress
 */
export interface HeliusOptions {
  apiKey?: string;
  rpcUrl?: string;
}

export class HeliusClient {
  private readonly rpcUrl: string;

  constructor(opts: HeliusOptions = {}) {
    // 优先用 apiKey 拼标准 Helius URL（带 ?api-key=）
    // 只在显式传 rpcUrl 且不含 api-key 时才用 rpcUrl（向后兼容自托管 RPC）
    const hasApiKeyInUrl = opts.rpcUrl?.includes("api-key=");
    const url =
      opts.apiKey
        ? `https://mainnet.helius-rpc.com/?api-key=${opts.apiKey}`
        : hasApiKeyInUrl
          ? opts.rpcUrl!
          : opts.rpcUrl ?? process.env.HELIUS_RPC_URL ?? "https://api.mainnet-beta.solana.com";
    this.rpcUrl = url;
  }

  private async rpc<T>(method: string, params: unknown[], attempt = 0): Promise<T> {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
    });
    // 429 / 5xx: 指数退避重试（最多 5 次）
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const wait = Math.min(2 ** attempt * 500, 8000) + Math.floor(Math.random() * 250);
      await new Promise((r) => setTimeout(r, wait));
      return this.rpc<T>(method, params, attempt + 1);
    }
    if (!res.ok) throw new Error(`Helius ${method} HTTP ${res.status}`);
    const json = (await res.json()) as { result?: T; error?: { message: string } };
    if (json.error) throw new Error(`Helius ${method}: ${json.error.message}`);
    return json.result as T;
  }

  getSignaturesForAddress(
    address: string,
    options: { limit?: number; until?: string; before?: string } = {},
  ) {
    return this.rpc<Array<{
      signature: string;
      slot: number;
      blockTime: number;
      err: unknown;
      memo: string | null;
    }>>("getSignaturesForAddress", [
      address,
      { limit: options.limit ?? 100, ...(options.until ? { until: options.until } : {}), ...(options.before ? { before: options.before } : {}) },
    ]);
  }

  getTransaction(signature: string) {
    return this.rpc<unknown>("getTransaction", [
      signature,
      { encoding: "json", maxSupportedTransactionVersion: 0, commitment: "confirmed" },
    ]);
  }

  /**
   * Helius Enhanced Transactions（同一 RPC endpoint，传 transactions by address）
   * 返回扁平结构，包含 tokenTransfers / nativeTransfers / accountData / events / type / source 等
   */
  getTransactionsForAddress(address: string, before?: string, limit = 100) {
    return this.rpc<Array<{
      signature: string;
      slot: number;
      blockTime: number;
      type: string;
      source?: string;
      fee: number;
      feePayer: string;
      nativeTransfers?: unknown[];
      tokenTransfers?: HeliusTokenTransfer[];
      accountData?: unknown[];
      events?: unknown;
      description?: string;
    }>>("getTransactionsForAddress", [
      address,
      ...(before ? [{ before, limit }] : [{ limit }]),
    ]);
  }

  /** DAS - get asset metadata */
  getAsset(id: string) {
    return this.rpc<HeliusAsset>("getAsset", [id]);
  }

  getAssetsByOwner(owner: string, page = 1, limit = 100) {
    return this.rpc<{ items: HeliusAsset[]; total: number; limit: number; page: number }>(
      "getAssetsByOwner",
      [
        { ownerAddress: owner, page, limit },
        { displayOptions: { showFungible: true, showNativeBalance: false } },
      ],
    );
  }
}

export interface HeliusTokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount: string;
  toTokenAccount: string;
  tokenAmount: number;
  decimals: number;
  tokenStandard: string;
  mint: string;
  tokenName?: string;
  tokenSymbol?: string;
}

export interface HeliusAsset {
  id: string;
  content?: {
    json_uri?: string;
    metadata?: {
      name?: string;
      symbol?: string;
      description?: string;
      image?: string;
    };
    links?: Record<string, string>;
  };
  token_info?: {
    symbol?: string;
    decimals?: number;
    supply?: number;
    price_info?: {
      price_per_token?: number;
      total_price?: number;
      currency?: string;
    };
  };
  authorities?: Array<{ address: string; scopes: string[] }>;
  creators?: Array<{ address: string; share: number }>;
  ownership?: { owner?: string; frozen?: boolean };
  renounced?: boolean;
}
