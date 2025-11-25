import { ethers } from "ethers";
import { getFreeProvider } from "./provider";

// priceFeeds.ts

export const PRICE_FEEDS: Record<string, string> = {
    ethereum: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",  
    sepolia: "0x694AA1769357215DE4FAC081bf1f309aDC325306",   
    polygon: "0xF9680D99D6C9589e2a93a78A04A279e509205945",   
    bsc:     "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE",
    zksync:  "0xD1ce60dc8AE060DDD17cA8716C96f193bC88DD13",   
    arbitrum: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",  
};


export async function getPrice(network: string = "ethereum" ) {
    const provider = getFreeProvider(network);

    const address = PRICE_FEEDS[network];
    if (!address) {
        throw new Error(`Unsupported network: ${network}`);
    }

    const feed = new ethers.Contract(
        address,
        [
            "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"
        ],
        provider
    );

    const [, price] = await feed.latestRoundData();
    return Number(price) / 1e8;
}