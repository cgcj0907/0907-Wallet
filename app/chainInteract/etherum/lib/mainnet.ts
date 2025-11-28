
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';
const CHAIN_ID = 1;

const BASE_URL =
  'https://api.etherscan.io/v2/api?' +
  `chainid=${CHAIN_ID}&module=account&apikey=${ETHERSCAN_API_KEY}`;

export async function getEthereumTransactions(address: string) {
    return fetch(`${BASE_URL}&action=txlist&address=${address}&page=1000`);
}

