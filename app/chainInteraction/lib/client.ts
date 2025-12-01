import { WalletClient } from "viem";

import { createSepoliaWalletClient } from "../etherum/lib/sepolia";
import { createEthereumWalletClient } from "../etherum/lib/mainnet";
import { createZkSyncWalletClient } from "../etherum/lib/zksync";


const WALLET_PROVIDERS: Record<
  string,
  (keyPath: string, password: string) => Promise<WalletClient>
> = {
  sepolia: createSepoliaWalletClient,
  ethereum: createEthereumWalletClient,
  zksync: createZkSyncWalletClient,
};


/**
 * 根据网络名称创建对应的 WalletClient
 */
export async function getWalletClient(
  network: string,
  keyPath: string,
  password: string
): Promise<WalletClient> {
  network = network.toLowerCase();
  const createFn = WALLET_PROVIDERS[network];
  if (!createFn) throw new Error(`Unsupported network: ${network}`);
  return await createFn(keyPath, password);
}
