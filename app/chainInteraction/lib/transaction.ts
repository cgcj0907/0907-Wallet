import { WalletClient } from 'viem';

import { signTransaction } from './sign';

import { getEthereumTransactions } from "../etherum/lib/mainnet";
import { getZkSyncTransactions } from "../etherum/lib/zksync";
import { getSepoliaTransactions } from "../etherum/lib/sepolia";


export interface UserTxInput {
  to: `0x${string}`;           // 必填：收款地址
  value: string;              // 必填：金额（string，前端输入框用）
  data?: `0x${string}`;       // 可选：合约调用数据（默认不填） 
  gasLimit?: string;          // 可选：gas limit（高级）
  maxFeePerGas?: string;      // 可选：最大 gas 费用（高级）
  maxPriorityFeePerGas?: string; // 可选：小费（高级）
}


const TRANSACTIONS: Record<string, (address: string) => Promise<Response>> = {
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

/**
 * 根据用户输入生成交易请求、签名并广播
 * @returns 交易哈希
 */
export async function sendTransactions(
  walletClient: WalletClient,
  userInput: UserTxInput
) : Promise<`0x${string}`> {
  const serializedTransaction = await signTransaction(walletClient, userInput);
  const hash = await walletClient.sendRawTransaction({ serializedTransaction })
  return hash;
}
