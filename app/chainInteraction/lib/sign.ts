// sign.ts
import { WalletClient, PublicClient, createPublicClient, http, LocalAccount } from "viem";
import { sepolia } from "viem/chains";

interface UserTxInput {
  to: `0x${string}`;
  value: string;
  data?: `0x${string}`;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * 本地签名交易（不发送，只返回序列化后的 rawTx）
 */
export async function signTransaction(
  walletClient: WalletClient,
  userInput: UserTxInput
) {


  const account = walletClient.account;

  if (!account) throw new Error("WalletClient 缺少 Local Account!");

  // ===== 1. 准备交易 =====
  const request = await walletClient.prepareTransactionRequest({
    chain: walletClient.chain!,
    account,
    to: userInput.to,
    value: BigInt(userInput.value),

    ...(userInput.data ? { data: userInput.data } : {}),
    ...(userInput.gasLimit ? { gas: BigInt(userInput.gasLimit) } : {}),
    ...(userInput.maxFeePerGas ? { maxFeePerGas: BigInt(userInput.maxFeePerGas) } : {}),
    ...(userInput.maxPriorityFeePerGas
      ? { maxPriorityFeePerGas: BigInt(userInput.maxPriorityFeePerGas) }
      : {}),
  });

  // ===== 2. 本地签名（你想做的事）=====
  const serializedTransaction = await walletClient.signTransaction(request) as `0x${string}`;

  return serializedTransaction;
}
