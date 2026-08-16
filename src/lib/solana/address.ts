/**
 * Solana 公钥基础校验（base58, 32 bytes）
 */
export function isValidSolanaAddress(address: string): boolean {
  if (typeof address !== "string") return false;
  if (address.length < 32 || address.length > 44) return false;
  // base58 不含 0 O I l
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}
