import { WalletClient } from "viem";

import { createSepoliaClient } from "../etherum/lib/sepolia";


const WALLET_PROVIDERS: Record<
  string,
  (keyPath: string, password: string) => Promise<WalletClient>
> = {
  sepolia: createSepoliaClient,
};


/**
 * 根据网络名称创建对应的 WalletClient
 */
export async function getWalletClient(
  network: string,
  keyPath: string,
  password: string
): Promise<WalletClient> {
  const createFn = WALLET_PROVIDERS[network];
  if (!createFn) throw new Error(`Unsupported network: ${network}`);
  return await createFn(keyPath, password);
}
