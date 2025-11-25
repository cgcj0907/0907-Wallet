import { ethers } from "ethers";
import { getFreeProvider } from "./provider";

export async function getBalance(address: string, network: string = "ethereum") {
    const provider = getFreeProvider(network);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
}
