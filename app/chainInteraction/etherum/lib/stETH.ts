
import { 
    createEthereumPublicClient, 
    createEthereumBundlerClient, 
    getEthereumERC20Transactions 
} from "./mainnet";

import { erc20Abi } from "viem";



import { UserTxInput } from "@/app/chainInteraction/lib/transaction";

const CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';


export async function getUSDTBalance(address: string) {

    const client = createEthereumPublicClient();
    const data = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
    })
    return data * BigInt(1e12);
}

export async function sendUSDTPaymasterTransaction(
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

export async function getUSDTTransactions(address: string) {
    return await getEthereumERC20Transactions(address, CONTRACT_ADDRESS);
}


