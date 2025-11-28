
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';
const CHAIN_ID = 324;
const CONTRACT_ADDRESS = '0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E';
const BASE_URL =
  'https://api.etherscan.io/v2/api?' +
  `chainid=${CHAIN_ID}&module=account&apikey=${ETHERSCAN_API_KEY}&contractaddress=${CONTRACT_ADDRESS}`;


export async function getZkSyncBalance(address: string) {
    return fetch(`${BASE_URL}&action=tokenbalance&address=${address}`);
}

export async function getZkSyncTransactions(address: string) {
    return fetch(`${BASE_URL}&action=tokentx&address=${address}&page=1000`);
}