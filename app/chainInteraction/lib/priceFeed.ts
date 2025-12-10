import { getPublicClient } from "./client";
import { parseAbi } from "viem";


// priceFeeds.ts

export const PRICE_FEEDS: Record<string, string> = {
    ethereum: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    usdt: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
    usdc: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    dai: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
    uni: "0x553303d460EE0afB37EdFf9bE42922D8FF63220e",
    aave: "0x547a514d5e3769680Ce22B2361c10Ea13619e8a9",
    sepolia: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    zksync: "0xD1ce60dc8AE060DDD17cA8716C96f193bC88DD13",
    steth: "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8",
};


export async function getPrice(network: string , tokenName: string) {
    network = network.toLowerCase();
    tokenName = tokenName.toLowerCase();
    const client = getPublicClient(network);
    
    const address = PRICE_FEEDS[tokenName];
    if (!address) {
        throw new Error(`Unsupported network: ${network}`);
    }
    const abi = parseAbi(['function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)']);
    const data = await client.readContract({
        address: address,
        abi: abi,
        functionName: 'latestRoundData',
    })
    return Number(data[1]) / 1e8;
}

