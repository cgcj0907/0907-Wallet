import { ethers } from "ethers";
import { getPublicClient } from "./client";
import { getZkSyncBalance } from "../etherum/lib/zksync";
import { getAAVEBalance } from "../etherum/lib/aave";
import { getUNIBalance } from "../etherum/lib/uni";
import { getDAIBalance } from "../etherum/lib/dai";
import { getUSDCBalance } from "../etherum/lib/USDC";
import { getUSDTBalance } from "../etherum/lib/USDT";
import { getSTETHBalance } from "../etherum/lib/STETH";
import { ERC20TOKEN_LIST } from "@/app/networkManagement/lib/details";




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
  steth: getSTETHBalance,
};

export async function getBalance(network: string, address: string, token: string) {
  if (!token) {
    return;
  }
  token = token.toLowerCase();

  if (ERC20TOKEN_LIST[network].includes(token)) {
    const get_balance = GET_BALANCE[token];
    const data = await get_balance(address);
    return ethers.formatEther(data);
  } else {
    const client = getPublicClient(token);
    const balance = await client.getBalance({ address });
    return ethers.formatEther(balance);
  }

}
