import { 
    createEthereumPublicClient, 
    createEthereumBundlerClient, 
    getEthereumERC20Transactions 
} from "./mainnet";

import { erc20Abi } from "viem";


import { UserTxInput } from "@/app/chainInteraction/lib/transaction";

const CONTRACT_ADDRESS = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';


export async function getAAVEBalance(address: string) {  
    
      const client = createEthereumPublicClient();
      const data = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
      })
  return data;
}

export async function sendAAVEPaymasterTransaction(
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
                args: [userInput.to, BigInt(userInput.value)],
            },
        ],
        authorization: authorization,
    });
    return hash;
}

export async function getAAVETransactions(address: string) {
    return await getEthereumERC20Transactions(address, CONTRACT_ADDRESS);
}




