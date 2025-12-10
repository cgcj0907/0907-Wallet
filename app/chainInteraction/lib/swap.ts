import { ETHEREUM_TOKEN_ADDRESS } from "@/app/networkManagement/lib/details";

import { createEthereumBundlerClient } from "../etherum/lib/mainnet";
import { USDTAbi } from "../abi/USDTAbi";
import { erc20Abi } from "viem";



export async function getSwapDetails(
    inputToken: string,
    outputToken: string,
    sellAmount: bigint,
    chainId: number = 1,
    address: string
) {
    inputToken = inputToken.toLowerCase();
    outputToken = outputToken.toLowerCase();
    const apiKey = 'df681021-9ee2-43c1-add4-64e7175059c1';
    if (!apiKey) throw new Error("Missing 0x API Key in environment variables");

    const inputTokenAddr = ETHEREUM_TOKEN_ADDRESS[inputToken];
    const outputTokenAddr = ETHEREUM_TOKEN_ADDRESS[outputToken];

    if (!inputTokenAddr || !outputTokenAddr) {
        throw new Error("Invalid token symbol");
    }
    const res = await fetch(
        `/api/swap?inputToken=${inputToken}&outputToken=${outputToken}&sellAmount=${sellAmount}&chainId=${chainId}&address=${address}`
    );


    if (!res.ok) {
        const text = await res.text();
        throw new Error(`0x API request failed: ${res.status} ${text}`);
    }

    const quote = await res.json();

    // 返回可直接用于 ethers.js 的交易对象
    return quote;
}


export async function sendSwapTransaction(keyPath: string, password: string,
    inputToken: string,
    outputToken: string,
    sellAmount: bigint,
    chainId: number = 1,
    address: string
) {
    inputToken = inputToken.toLowerCase();
    outputToken = outputToken.toLowerCase();
    const [bundlerClient, simple7702Account, authorization] = await createEthereumBundlerClient(keyPath, password);
    const result = await getSwapDetails(
        inputToken,
        outputToken,
        sellAmount,
        chainId,
        address
    );

    const transaction = result.transaction;
    const spender = result.issues.allowance.spender;
    const amountApproved = sellAmount * 105n / 100n;
    let hash;
    if (inputToken === 'usdt') {
        hash = await bundlerClient.sendUserOperation({
            account: simple7702Account,
            calls: [
                {
                    to: ETHEREUM_TOKEN_ADDRESS[inputToken] as `0x${string}`,
                    abi: USDTAbi,
                    functionName: "approve",
                    args: [spender as `0x${string}`, 0n]

                },

                {
                    to: ETHEREUM_TOKEN_ADDRESS[inputToken] as `0x${string}`,
                    abi: USDTAbi,
                    functionName: "approve",
                    args: [spender as `0x${string}`, amountApproved]

                },
                {
                    to: transaction.to,
                    data: transaction.data,
                    value: transaction.value
                },
            ],
            authorization: authorization,
        });
    } else if (inputToken === 'ethereum') {
        hash = await bundlerClient.sendUserOperation({
            account: simple7702Account,
            calls: [
                {
                    to: transaction.to,
                    data: transaction.data,
                    value: transaction.value
                },
            ],
            authorization: authorization,
        });
    } else {
        hash = await bundlerClient.sendUserOperation({
            account: simple7702Account,
            calls: [

                {
                    to: ETHEREUM_TOKEN_ADDRESS[inputToken] as `0x${string}`,
                    abi: erc20Abi,
                    functionName: "approve",
                    args: [spender as `0x${string}`, amountApproved]

                },
                {
                    to: transaction.to,
                    data: transaction.data,
                    value: transaction.value
                },
            ],
            authorization: authorization,
        });
    }

    return hash;

}

