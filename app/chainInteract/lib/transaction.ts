import { getEthereumTransactions } from "../etherum/lib/mainnet";
import { getZkSyncTransactions } from "../etherum/lib/zksync";
import { getSepoliaTransactions } from "../etherum/lib/sepolia";

const TRANSACTIONS : Record<string, (address: string) => Promise<Response>> = {
    ethereum: getEthereumTransactions,
    zksync: getZkSyncTransactions,
    sepolia: getSepoliaTransactions,
};

/**
 * 根据网络和地址获取交易记录
 * @param address 用户地址
 * @param network 网络名称
 */
export async function getTransactions(address: string, network: string = "ethereum") {
  const fetchFn = TRANSACTIONS[network];
  if (!fetchFn) throw new Error(`Unsupported network: ${network}`);

  const response = await fetchFn(address); // fetch 返回 Response
  const data = await response.json();      // 解析 JSON



  return data.result; // 返回交易数组
}