import { WalletClient, createWalletClient, createPublicClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { eip712WalletActions } from 'viem/zksync';

import { zksync } from 'viem/chains'

import { getPrivateKey } from "@/app/walletManagement/lib/getPrivateKey";

import { erc20Abi } from "viem";

import { UserTxInput } from "@/app/chainInteraction/lib/transaction";

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY;
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';
const CHAIN_ID = 324;
const CONTRACT_ADDRESS = '0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E';
const BASE_URL =
  'https://api.etherscan.io/v2/api?' +
  `chainid=${CHAIN_ID}&module=account&apikey=${ETHERSCAN_API_KEY}&contractaddress=${CONTRACT_ADDRESS}`;
const PAYMASTER_URL = "https://api.zyfi.org/api/erc20_paymaster/v1";



export async function getZkSyncBalance(address: string) {  
    
      const client = createZkSyncPublicClient();
      const data = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
      })
  return data;
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
      "https://mainnet.era.zksync.io"
    ),
  }).extend(eip712WalletActions());
}


export function createZkSyncPublicClient() {
  const publicClient = createPublicClient({
    chain: zksync,
    transport: http()
  });
  return publicClient;
}

export async function sendZkSyncPaymasterTransaction(
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


  // 发送交易（实际上使用 walletClient）
  const hash = await walletClient.sendTransaction(txPayload);
  return hash;
}


