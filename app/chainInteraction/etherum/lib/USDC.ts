
import { 
    createEthereumPublicClient, 
    createEthereumBundlerClient, 
    getEthereumERC20Transactions 
} from "./mainnet";


import { erc20Abi } from "viem";


import { UserTxInput } from "@/app/chainInteraction/lib/transaction";

const CONTRACT_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';



export async function getUSDCBalance(address: string) {  
    
      const client = createEthereumPublicClient();
      const data = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
      })
  return data * BigInt(1e12);
}

export async function sendUSDCPaymasterTransaction(
    keyPath: string,
    password: string,
    userInput: UserTxInput
) {

    const [bundlerClient, simple7702Account, authorization] = await createEthereumBundlerClient(keyPath, password);

    const hash = await bundlerClient.sendUserOperation({
        account: simple7702Account,
        calls: [
            {
                to: CONTRACT_ADDRESS,
                abi: erc20Abi,
                functionName: "transfer",
                args: [userInput.to, BigInt(userInput.value) / 10n ** 12n],
            },
        ],
        authorization: authorization,
    });
    return hash;
}

export async function getUSDCTransactions(address: string) {
    return await getEthereumERC20Transactions(address, CONTRACT_ADDRESS);
}

