import { ethers } from "ethers";
import { getFreeProvider } from "./provider";
import { getZkSyncBalance } from "../etherum/lib/zksync";


export async function getBalance(address: string, network: string = "ethereum") {
    if (network === "zksync") {
        const res = await getZkSyncBalance(address);
        const data = await res.json();
        return ethers.formatEther(data.result);
    } else {
    const provider = getFreeProvider(network);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
    }
}
