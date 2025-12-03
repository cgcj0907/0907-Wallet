
import { createEthereumPublicClient } from "./mainnet";

import { erc20Abi } from "viem";


const CONTRACT_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';


export async function getDAIBalance(address: string) {  
    
      const client = createEthereumPublicClient();
      const data = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
      })
  return data;
}
