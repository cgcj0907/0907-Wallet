import { WalletClient, createWalletClient, createPublicClient, http, encodeFunctionData, decodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { eip712WalletActions } from 'viem/zksync';

import { zksync } from 'viem/chains'

import { getPrivateKey } from "@/app/walletManagement/lib/getPrivateKey";

import { erc20Abi } from "../abi/erc20Abi";

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY;
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';
const CHAIN_ID = 324;
const CONTRACT_ADDRESS = '0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E';
const BASE_URL =
  'https://api.etherscan.io/v2/api?' +
  `chainid=${CHAIN_ID}&module=account&apikey=${ETHERSCAN_API_KEY}&contractaddress=${CONTRACT_ADDRESS}`;
const PAYMASTER_URL = "https://api.zyfi.org/api/erc20_paymaster/v1";

export interface UserTxInput {
  to: `0x${string}`;           // 必填：收款地址
  value: string;              // 必填：金额（string，前端输入框用）
  data?: `0x${string}`;       // 可选：合约调用数据（默认不填） 
  gasLimit?: string;          // 可选：gas limit（高级）
  maxFeePerGas?: string;      // 可选：最大 gas 费用（高级）
  maxPriorityFeePerGas?: string; // 可选：小费（高级）
}

export async function getZkSyncBalance(address: string) {
  return fetch(`${BASE_URL}&action=tokenbalance&address=${address}`);
}

export async function getZkSyncTransactions(address: string) {
  return fetch(`${BASE_URL}&action=tokentx&address=${address}&page=1000`);
}

export async function createZkSyncWalletClient(
  keyPath: string,
  password: string
): Promise<WalletClient> {

  const privateKey = await getPrivateKey(keyPath, password) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    transport: http(
      // `https://zksync-mainnet.infura.io/v3/${INFURA_API_KEY}`
      "https://mainnet.era.zksync.io"
    ),
  }).extend(eip712WalletActions());
}

export async function createZksyncPublicClient() {
  const publicClient = createPublicClient({
    chain: zksync,
    transport: http(
      `https://zksync-mainnet.infura.io/v3/${INFURA_API_KEY}`
    )
  });
  return publicClient;
}

export async function sendPaymasterTransaction(
  walletClient: WalletClient,
  userInput: UserTxInput
) {
  if (!walletClient.account?.address) {
    throw new Error("钱包解析异常");
  }
  const from = walletClient.account.address;

  // encode transfer calldata (保持你原来的做法)
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [userInput.to, BigInt(userInput.value)],
  });

  const body = {
    chainId: CHAIN_ID,
    feeTokenAddress: CONTRACT_ADDRESS,
    isTestnet: false,
    checkNFT: false,
    txData: {
      from,
      to: CONTRACT_ADDRESS,
      value: "0",
      data,
    },
  };

  const res = await fetch(PAYMASTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`paymaster API error ${res.status} ${txt}`);
  }

  const json = await res.json();
  const rawTx = json.txData;
  if (!rawTx) throw new Error("paymaster 返回缺少 txData");

  // 提取 paymaster 信息（保留原始字段）
  const paymaster = rawTx?.customData?.paymasterParams?.paymaster;
  const paymasterInput = rawTx?.customData?.paymasterParams?.paymasterInput;

// 组装 txPayload（完整字段）
const txPayload: any = {
  account: walletClient.account,
  to: rawTx.to ?? CONTRACT_ADDRESS,
  value: rawTx.value ? BigInt(rawTx.value) : BigInt(0),
  chain: zksync,
  data: rawTx.data ?? data,
  paymaster,
  paymasterInput,
  gas: rawTx.gasLimit ? BigInt(rawTx.gasLimit) : BigInt(0),
  gasPerPubdata: rawTx.customData?.gasPerPubdata
    ? BigInt(rawTx.customData.gasPerPubdata)
    : BigInt(0),
  maxFeePerGas: rawTx.maxFeePerGas ? BigInt(rawTx.maxFeePerGas) : BigInt(0),
  maxPriorityFeePerGas: BigInt(0),
};


  // nonce：优先用 API 返回的 nonce，如果没有，尝试从 walletClient / publicClient 获取；
  // 如果都不可用，则不设置 nonce（让 walletClient 自行处理）
  if (rawTx.nonce !== undefined && rawTx.nonce !== null) {
    try {
      txPayload.nonce = BigInt(rawTx.nonce);
    } catch {
      // ignore parsing error
    }
  } else {
    // 尝试从 walletClient 获取交易计数（注意：不同项目暴露的 API 名称可能不同）
    try {
      // 常见做法：publicClient.getTransactionCount({ address, blockTag: 'pending' })
      // 但因为你说 walletClient 的创建不要改，这里尝试可选方式：
      const anyClient = walletClient as any;
      if (typeof anyClient.getTransactionCount === "function") {
        const txCount = await anyClient.getTransactionCount({
          address: from,
          blockTag: "pending",
        });
        txPayload.nonce = BigInt(txCount);
      } else if (typeof anyClient.getNonce === "function") {
        const txCount = await anyClient.getNonce({ address: from });
        txPayload.nonce = BigInt(txCount);
      } else {
        // 最后退回：不设置 nonce，交给 walletClient.sendTransaction 自行填充
      }
    } catch (e) {
      // 获取 nonce 失败，不阻塞，继续让 walletClient 处理
    }
  }

  // 发送交易（实际上使用 walletClient）
  const hash = await walletClient.sendTransaction(txPayload);
  return hash;
}


// (async () => {
//     const data = '0xa9059cbb00000000000000000000000014e10584fdbeadf2429a2c213bf1c575bbcc59410000000000000000000000000000000000000000000000004563918244f40000';
//     const de_data = decodeFunctionData({
//     abi: erc20Abi,
//     data: data
//   });
//   console.log(de_data);
  
// })()