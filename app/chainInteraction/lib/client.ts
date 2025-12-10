import {  WalletClient } from "viem";


import { createSepoliaWalletClient, createSepoliaPublicClient } from "../etherum/lib/sepolia";
import { createEthereumWalletClient, createEthereumPublicClient } from "../etherum/lib/mainnet";
import { createZkSyncWalletClient, createZkSyncPublicClient } from "../etherum/lib/zksync";


const WALLET_PROVIDERS: Record<
  string,
  (keyPath: string, password: string) => Promise<WalletClient>
> = {
  sepolia: createSepoliaWalletClient,
  ethereum: createEthereumWalletClient,
  zksync: createZkSyncWalletClient,
};

const PUBLIC_PROVIDERS: Record<
  string,
  () => any
> = {
  sepolia: createSepoliaPublicClient,
  ethereum: createEthereumPublicClient,
  zksync: createZkSyncPublicClient,
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

export function getPublicClient(network: string) {

  network = network.toLowerCase();
  const createFn = PUBLIC_PROVIDERS[network];
  if (!createFn) throw new Error(`unsupported network: ${network}`);
  return createFn();
}
