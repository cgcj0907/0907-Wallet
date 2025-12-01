import { WalletClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

import { getPrivateKey } from "@/app/walletManagement/lib/getPrivateKey";
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';
const CHAIN_ID = 11155111;

const BASE_URL =
  'https://api.etherscan.io/v2/api?' +
  `chainid=${CHAIN_ID}&module=account&apikey=${ETHERSCAN_API_KEY}`;


export async function getSepoliaTransactions(address: string) {
  return fetch(`${BASE_URL}&action=txlist&address=${address}&page=1000`);
}

export async function createSepoliaClient(
  keyPath: string,
  password: string
): Promise<WalletClient> {

  const privateKey = await getPrivateKey(keyPath, password) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(
      `https://sepolia.infura.io/v3//v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
    ),
  });
}

