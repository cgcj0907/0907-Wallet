import {
    getContract,
    erc20Abi,
    maxUint256,
    parseSignature
} from "viem";

import { STKWATOKEN_ABI, POOL_ABI, BATCH_HELPER_ABI, REWARDS_CONTROLLER_ABI } from "../abi/AaveAbi";
import { createEthereumPublicClient, createEthereumBundlerClient } from "../etherum/lib/mainnet";
import { getPrice } from "./priceFeed";
import { signPermit } from "./permit";
import { eip2612Abi } from "../abi/erc2612Abi";


const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const STKWAETHUSDC_ADDRESS = '0x6bf183243FdD1e306ad2C4450BC7dcf6f0bf8Aa6';
const STKWAETHUSDT_ADDRESS = '0xA484Ab92fe32B143AEE7019fC1502b1dAA522D31';
const POOL_V3 = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
const AETHUSDC_ADDRESS = '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c';
const AETHUSDT_ADDRESS = '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a';
const BATCH_HELPER = '0xCe6Ced23118EDEb23054E06118a702797b13fc2F';

export async function getAssetsOfaToken(token: string, address?: string) {
    const client = createEthereumPublicClient();
    let tokenAddress;
    if (token === 'ausdc') {
        tokenAddress = AETHUSDC_ADDRESS;
    } else {
        tokenAddress = AETHUSDT_ADDRESS;
    }
    const contract = getContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        client: client
    })
    if (address) {
        const [balance, totalAssets, price] = await Promise.all([
            contract.read.balanceOf([address as `0x${string}`]),
            contract.read.totalSupply(),
            getPrice('ethereum', 'usdc')
        ]);
        const formatBalance = Number(balance) / 1e6;

        const userAssets = Number(balance) * price / 1e6;
        const poolAssets = Number(totalAssets) * price / 1e6;

        return [userAssets, poolAssets, formatBalance];
    } else {
        const [totalAssets, price] = await Promise.all([
            contract.read.totalSupply(),
            getPrice('ethereum', 'usdc')
        ]);

        const poolAssets = Number(totalAssets) * price / 1e6;

        return [0, poolAssets, 0];
    }

}
export async function stakeToken(keyPath: string, password: string, token: string, amountIn: bigint) {
    token = token.toLowerCase();
    const [bundlerClient, simple7702Account, authorization] = await createEthereumBundlerClient(keyPath, password);
    const approveAmount = amountIn * 105n / 100n;
    let tokenAddress;
    if (token === 'usdc') {
        tokenAddress = USDC_ADDRESS;
        const client = createEthereumPublicClient();
        const signature = await signPermit({
            tokenAddress,
            client,
            account: simple7702Account,
            spenderAddress: POOL_V3,
            permitAmount: amountIn
        });

        const { r, s, yParity } = parseSignature(signature);
        const v = yParity + 27;

        const hash = await bundlerClient.sendUserOperation({
            account: simple7702Account,
            calls: [

                {
                    to: POOL_V3,
                    abi: POOL_ABI,
                    functionName: "supplyWithPermit",
                    args: [tokenAddress, amountIn,
                        simple7702Account.address, 0, maxUint256, v, r, s],
                },
            ],
            authorization: authorization,
        });
        return hash;
    } else {
        tokenAddress = USDT_ADDRESS;

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

    // const client = createEthereumPublicClient();
    // const signature = await signPermit({
    //     tokenAddress,
    //     client,
    //     account: simple7702Account,
    //     spenderAddress: POOL_V3,
    //     permitAmount: amountIn
    // });

    // const { r, s, yParity } = parseSignature(signature);
    // const v = yParity + 27;

    // const permitResult = await client.simulateContract({
    //     address: USDC_ADDRESS,
    //     abi: eip2612Abi,
    //     functionName: 'permit',
    //     args: [
    //         simple7702Account.address,
    //         POOL_V3,
    //         amountIn,
    //         maxUint256,
    //         v,  // 应该是 38，不是 37
    //         r,
    //         s
    //     ],
    //     account: simple7702Account,
    // });
    // console.log(permitResult)
    // const result = await client.simulateContract({
    //     address: POOL_V3,
    //     abi: POOL_ABI,
    //     functionName: 'supplyWithPermit',
    //     args: [tokenAddress, amountIn,
    //         simple7702Account.address, 0, maxUint256, v, r, s],
    //     account: simple7702Account,
    // })
    // console.log(result);
    // return result;

}

export async function reedeemAtoken(keyPath: string, password: string, token: string, amountIn: bigint) {
    token = token.toLowerCase();
    let tokenAddress;
    if (token === 'usdc') {
        tokenAddress = USDC_ADDRESS;
    } else {
        tokenAddress = USDT_ADDRESS;
    }
    const client = createEthereumPublicClient();
    const [bundlerClient, simple7702Account, authorization] = await createEthereumBundlerClient(keyPath, password);
    const result = await client.simulateContract({
        address: POOL_V3,
        abi: POOL_ABI,
        functionName: 'withdraw',
        args: [tokenAddress, maxUint256, simple7702Account.address],
    })
    console.log(result);
    return result;

}

export async function getAssetsOfStkwaToken(
    token: string,
    address?: string
) {
    const client = createEthereumPublicClient();
    let tokenAddress;
    if (token === 'stkwausdc') {
        tokenAddress = STKWAETHUSDC_ADDRESS;
    } else {
        tokenAddress = STKWAETHUSDT_ADDRESS;
    }
    const contract = getContract({
        address: tokenAddress as `0x${string}`,
        abi: STKWATOKEN_ABI,
        client: client
    })
    if (address) {
        const [balance, totalAssets, price] = await Promise.all([
            contract.read.balanceOf([address as `0x${string}`]) as Promise<bigint>,
            contract.read.totalSupply() as Promise<bigint>,
            contract.read.latestAnswer() as Promise<bigint>
        ]);
        const formatBalance = Number(balance) / 1e6;
        const userAssets = Number(balance * price) / 1e14;
        const poolAssets = Number(totalAssets * price) / 1e14;

        return [userAssets, poolAssets, formatBalance];
    } else {
        const [totalAssets, price] = await Promise.all([

            contract.read.totalSupply() as Promise<bigint>,
            contract.read.latestAnswer() as Promise<bigint>
        ]);

        const poolAssets = Number(totalAssets * price) / 1e14;

        return [0, poolAssets, 0];
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

export async function redeemStkwaToken(keyPath: string, password: string, amountOut: bigint, token: string) {
    token = token.toLowerCase();
    const [bundlerClient, simple7702Account, authorization] = await createEthereumBundlerClient(keyPath, password);
    let tokenAddress;
    let stkwatokenAddress;
    if (token === 'usdc') {
        tokenAddress = USDC_ADDRESS;
        stkwatokenAddress = STKWAETHUSDC_ADDRESS;
    } else {
        tokenAddress = USDT_ADDRESS;
        stkwatokenAddress = STKWAETHUSDT_ADDRESS;
    }
    const client = createEthereumPublicClient();

    const contract = getContract({
        address: stkwatokenAddress as `0x${string}`,
        abi: STKWATOKEN_ABI,
        client: client
    })
    const balance = (await contract.read.balanceOf([simple7702Account.address])) as bigint;
    const approveAmount = balance * 105n / 100n;
    console.log(approveAmount, amountOut)
    if (amountOut > balance) {
        amountOut = balance;
    }
    const hash = await bundlerClient.sendUserOperation({
        account: simple7702Account,
        calls: [
            {
                to: stkwatokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: "approve",
                args: [BATCH_HELPER, approveAmount]
            },
            {
                to: BATCH_HELPER,
                abi: BATCH_HELPER_ABI,
                functionName: "redeem",
                args: [
                    [
                        stkwatokenAddress,
                        tokenAddress,
                        amountOut]

                ]
            },
        ],

        authorization: authorization,
    });
    return hash;

}

export async function caculateRewards(address: string, token: string) {
    token = token.toLowerCase();
    let stkwatokenAddress;
    if (token === 'stkwausdc') {
        stkwatokenAddress = STKWAETHUSDC_ADDRESS;
    } else {
        stkwatokenAddress = STKWAETHUSDT_ADDRESS;
    }
    const client = createEthereumPublicClient();
    const contract = getContract({
        address: stkwatokenAddress as `0x${string}`,
        abi: STKWATOKEN_ABI,
        client: client
    })
    const REWARDS_CONTROLLER = await contract.read.REWARDS_CONTROLLER() as `0x${string}`;


    const { result } = await client.simulateContract({
        address: REWARDS_CONTROLLER,
        abi: REWARDS_CONTROLLER_ABI,
        functionName: 'calculateCurrentUserRewards',
        args: [stkwatokenAddress, address]
    })
    return result;
}

export async function getRewards(address: string, token: string) {
    token = token.toLowerCase();
    let stkwatokenAddress;
    if (token === 'stkwausdc') {
        stkwatokenAddress = STKWAETHUSDC_ADDRESS;
    } else {
        stkwatokenAddress = STKWAETHUSDT_ADDRESS;
    }
    const client = createEthereumPublicClient();
    const contract = getContract({
        address: stkwatokenAddress as `0x${string}`,
        abi: STKWATOKEN_ABI,
        client: client
    })
    const REWARDS_CONTROLLER = await contract.read.REWARDS_CONTROLLER() as `0x${string}`;


    const result = await client.simulateContract({
        address: REWARDS_CONTROLLER,
        abi: REWARDS_CONTROLLER_ABI,
        functionName: 'claimAllRewards',
        args: [stkwatokenAddress, address]
    })
    console.log(result);
    return result;
}


export async function cooldown(keyPath: string, password: string, token: string) {
    token = token.toLowerCase();
    console.log(token)
    const [bundlerClient, simple7702Account, authorization] = await createEthereumBundlerClient(keyPath, password);
    const client = createEthereumPublicClient();
    let tokenAddress;
    if (token === 'usdc') {
        tokenAddress = STKWAETHUSDC_ADDRESS;
    } else {
        tokenAddress = STKWAETHUSDT_ADDRESS;
    }

    const { result } = await client.simulateContract({
        address: tokenAddress as `0x${string}`,
        abi: STKWATOKEN_ABI,
        
        functionName: 'cooldown',
        account: simple7702Account,

    })

    return result;

}

