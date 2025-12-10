// sign.ts
import { WalletClient } from "viem";

;
import { UserTxInput } from "@/app/chainInteraction/lib/transaction";

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

    // ===== 2. 本地签名 =====
    const serializedTransaction = await walletClient.signTransaction(request) as `0x${string}`;

    return serializedTransaction;

}

