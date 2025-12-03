import { ethers } from "ethers";
import { getPublicClient } from "./client";
import { getZkSyncBalance } from "../etherum/lib/zksync";
import { getAAVEBalance } from "../etherum/lib/aave";
import { getUNIBalance } from "../etherum/lib/uni";
import { getDAIBalance } from "../etherum/lib/dai";
import { getUSDCBalance } from "../etherum/lib/USDC";
import { getUSDTBalance } from "../etherum/lib/USDT";

const ERC20_TOKEN  = ['zksync', 'dai', 'uni', 'usdt', 'usdc', 'aave']


const GET_BALANCE: Record<
  string,
  (address: string) => Promise<bigint>
> = {
  zksync: getZkSyncBalance,
  dai: getDAIBalance,
  aave: getAAVEBalance,
  uni: getUNIBalance,
  usdt: getUSDTBalance,
  usdc: getUSDCBalance,
};

export async function getBalance(address: string, network: string = "ethereum") {
    network = network.toLowerCase();
    if (ERC20_TOKEN.includes(network)) {
        const get_balance = GET_BALANCE[network];
        const data = await get_balance(address);
        return ethers.formatEther(data);
    } else {
    const client = getPublicClient(network);
    const balance = await client.getBalance({address});
    return ethers.formatEther(balance);
    }
}
