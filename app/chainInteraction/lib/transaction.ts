import { WalletClient } from 'viem';

import { signTransaction } from './sign';
import { getWalletClient } from './client';

import { getEthereumTransactions } from "../etherum/lib/mainnet";
import { getZkSyncTransactions } from "../etherum/lib/zksync";
import { getSepoliaTransactions } from "../etherum/lib/sepolia";
import { getUSDTTransactions } from '../etherum/lib/USDT';
import { getUSDCTransactions } from '../etherum/lib/USDC';
import { getDAITransactions } from '../etherum/lib/dai';
import { getAAVETransactions } from '../etherum/lib/aave';
import { getUNITransactions } from '../etherum/lib/uni';

import { sendZkSyncPaymasterTransaction } from '../etherum/lib/zksync'
import { sendUSDTPaymasterTransaction } from '../etherum/lib/USDT';
import { sendUSDCPaymasterTransaction } from '../etherum/lib/USDC';
import { sendAAVEPaymasterTransaction } from '../etherum/lib/aave';
import { sendUNIPaymasterTransaction } from '../etherum/lib/uni';
import { sendDAIPaymasterTransaction } from '../etherum/lib/dai';
import { getUint } from 'ethers';

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
  usdt: getUSDTTransactions,
  usdc: getUSDCTransactions,
  aave: getAAVETransactions,
  dai: getDAITransactions,
  uni: getUNITransactions,
};

const ERC20_TRANSFER: Record<string, (keyPath: string,
  password: string,
  userInput: UserTxInput,) => Promise<`0x${string}`>> = {
  usdt: sendUSDTPaymasterTransaction,
  usdc: sendUSDCPaymasterTransaction,
  dai: sendDAIPaymasterTransaction,
  aave: sendAAVEPaymasterTransaction,
  uni: sendUNIPaymasterTransaction,

};

/**
 * 根据网络和地址获取交易记录
 * @param address 用户地址
 * @param network 网络名称
 */
export async function getTransactions(address: string, token: string = "ethereum") {
  const fetchFn = TRANSACTIONS[token];
  if (!fetchFn) throw new Error(`Unsupported token: ${token}`);

  const response = await fetchFn(address); // fetch 返回 Response
  const data = await response.json();      // 解析 JSON



  return data.result; // 返回交易数组
}

/**
 * 根据用户输入生成交易请求、签名并广播
 * @returns 交易哈希
 */
export async function sendTransactions(
  network: string,
  keyPath: string,
  password: string,
  userInput: UserTxInput,
  token: string | undefined,
): Promise<`0x${string}`> {
  if (!network) {
    throw Error("网络异常");
  }
  network = network.toLowerCase();
  const walletClient: WalletClient = await getWalletClient(network, keyPath, password);
  if (network !== "zksync") {
    if (token) {
      token = token.toLowerCase();
      const erc20Transfer = ERC20_TRANSFER[token];
      const hash = await erc20Transfer(keyPath, password, userInput);
      if( ! hash ) {
        throw Error("发送交易失败");
      }
      return hash;
    } else {
      const serializedTransaction = await signTransaction(walletClient, userInput);
      if (serializedTransaction) {
        const hash = await walletClient.sendRawTransaction({ serializedTransaction })
        return hash;
      } else {
        throw Error("发送交易失败");
      }
    }
  } else {
    const hash = sendZkSyncPaymasterTransaction(walletClient, userInput);
    return hash;
  }
}
