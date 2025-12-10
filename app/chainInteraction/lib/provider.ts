// /app/chainInteract/lib/provider.ts
import { ethers } from "ethers";

// 常见免费 RPC 列表
const freeRPC: Record<string, string> = {
    ethereum: "https://ethereum.publicnode.com",
    sepolia: "https://ethereum-sepolia-rpc.publicnode.com", 
    zksync: "https://mainnet.era.zksync.io"  
};


// ----------------- 免费 JSON-RPC Provider（不需要 API）-----------------
export function getFreeProvider(network: string = "ethereum") {
    network = network.toLowerCase();


    if (!freeRPC[network]) {
        throw new Error(`不支持的免费网络：${network}`);
    }


    return new ethers.JsonRpcProvider(freeRPC[network]);
}