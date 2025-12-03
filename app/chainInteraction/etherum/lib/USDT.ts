
import { createEthereumPublicClient } from "./mainnet";

import { erc20Abi } from "viem";


const CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';


export async function getUSDTBalance(address: string) {  
    
      const client = createEthereumPublicClient();
      const data = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
      })
  return data;
}
