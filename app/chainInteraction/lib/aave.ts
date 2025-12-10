import {
    getContract,
    erc20Abi
} from "viem";

import { STKWATOKEN_ABI, POOL_ABI, BATCH_HELPER_ABI } from "../abi/AaveAbi";
import { createEthereumPublicClient, createEthereumBundlerClient } from "../etherum/lib/mainnet";
import { getPrice } from "./priceFeed";

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const STKWAETHUSDC_ADDRESS = '0x6bf183243FdD1e306ad2C4450BC7dcf6f0bf8Aa6';
const STKWAETHUSDT_ADDRESS = '0xA484Ab92fe32B143AEE7019fC1502b1dAA522D31';
const POOL_V3 = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
const AETHUSDC_ADDRESS = '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c';
const AETHUSDT_ADDRESS = '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a';
const BATCH_HELPER = '0xCe6Ced23118EDEb23054E06118a702797b13fc2F';

export async function getAssetsOfaToken(token: string, address: string) {
    const client = createEthereumPublicClient();
    if (token === 'usdc') {
        const contract = getContract({
            address: AETHUSDC_ADDRESS,
            abi: erc20Abi,
            client: client
        })
        const [balance, totalAssets, price] = await Promise.all([
            contract.read.balanceOf([address as `0x${string}`]),
            contract.read.totalSupply(),
            getPrice('ethereum', 'usdc')
        ]);
        const formatBalance = Number(balance) / 1e6;

        const userAssets = Number(balance) * price / 1e6;
        const poolAssets = Number(totalAssets) * price / 1e6;

        return [userAssets, poolAssets, formatBalance];


    } else if (token === 'usdt') {
        const contract = getContract({
            address: AETHUSDT_ADDRESS,
            abi: erc20Abi,
            client: client
        })
        const [balance, totalAssets, price] = await Promise.all([
            contract.read.balanceOf([address as `0x${string}`]),
            contract.read.totalSupply(),
            getPrice('ethereum', 'usdc')
        ]);
        const formatBalance = Number(balance) / 1e6;

        const userAssets = Number(balance) * price / 1e6;
        const poolAssets = Number(totalAssets) * price / 1e6;

        return [userAssets, poolAssets, formatBalance];

    }
}
export async function stakeToken(keyPath: string, password: string, token: string, amountIn: bigint) {
    token = token.toLowerCase();
    const approveAmount = amountIn * 105n / 100n;
    let tokenAddress;
    if (token === 'usdc') {
        tokenAddress = USDC_ADDRESS;
    } else {
        tokenAddress = USDT_ADDRESS;
    }

    const [bundlerClient, simple7702Account, authorization] = await createEthereumBundlerClient(keyPath, password);

    const hash = await bundlerClient.sendUserOperation({
        account: simple7702Account,
        calls: [
            {
                to: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: "approve",
                args: [POOL_V3, approveAmount]
            },
            {
                to: POOL_V3,
                abi: POOL_ABI,
                functionName: "supply",
                args: [
                    tokenAddress as `0x${string}`,
                    amountIn,
                    simple7702Account.address,
                    0,
                ]
            },
        ],
        authorization: authorization,
    });
    return hash;
}

export async function getAssetsOfStkwaToken(
    token: string,
    address: string
) {
    const client = createEthereumPublicClient();
    if (token === 'stkwausdc') {
        const contract = getContract({
            address: STKWAETHUSDC_ADDRESS,
            abi: STKWATOKEN_ABI,
            client: client
        })
        const [balance, totalAssets, price] = await Promise.all([
            contract.read.balanceOf([address as `0x${string}`]) as Promise<bigint>,
            contract.read.totalSupply() as Promise<bigint>,
            contract.read.latestAnswer() as Promise<bigint>
        ]);
        const formatBalance = Number(balance) / 1e6;
        const userAssets = Number(balance * price) / 1e14;
        const poolAssets = Number(totalAssets * price) / 1e14;

        return [userAssets, poolAssets, formatBalance];


    } else if (token === 'stkwausdt') {
        const contract = getContract({
            address: STKWAETHUSDT_ADDRESS,
            abi: STKWATOKEN_ABI,
            client: client
        })
        const [balance, totalAssets, price] = await Promise.all([
            contract.read.balanceOf([address as `0x${string}`]) as Promise<bigint>,
            contract.read.totalSupply() as Promise<bigint>,
            contract.read.latestAnswer() as Promise<bigint>
        ]);

        const formatBalance = Number(balance) / 1e6;
        const userAssets = Number(balance * price) / 1e14;
        const poolAssets = Number(totalAssets * price) / 1e14;
        return [userAssets, poolAssets, formatBalance];


    }
}


export async function convertToStkwaToken(keyPath: string, password: string, amountIn: bigint, token: string) {
    const [bundlerClient, simple7702Account, authorization] = await createEthereumBundlerClient(keyPath, password);
    const approveAmount = amountIn * 105n / 100n;
    let tokenAddress;
    let stkwatokenAddress;
    if (token === 'usdc') {
        tokenAddress = USDC_ADDRESS;
        stkwatokenAddress = STKWAETHUSDC_ADDRESS;
    } else if (token === 'ausdc') {
        tokenAddress = AETHUSDC_ADDRESS;
        stkwatokenAddress = STKWAETHUSDC_ADDRESS;
    } else if (token === 'usdt') {
        tokenAddress = USDT_ADDRESS;
        stkwatokenAddress = STKWAETHUSDT_ADDRESS;
    } else {
        tokenAddress = AETHUSDT_ADDRESS;
        stkwatokenAddress = STKWAETHUSDT_ADDRESS;
    }
    const hash = await bundlerClient.sendUserOperation({
        account: simple7702Account,
        calls: [
            {
                to: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: "approve",
                args: [BATCH_HELPER, approveAmount]
            },
            {
                to: BATCH_HELPER,
                abi: BATCH_HELPER_ABI,
                functionName: "deposit",
                args: [
                    [
                        stkwatokenAddress,
                        tokenAddress,
                        amountIn]

                ]
            },
        ],

        authorization: authorization,
    });
    return hash;
}

