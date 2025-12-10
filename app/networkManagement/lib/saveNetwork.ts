import { get, set, del, values, keys } from '@/app/lib/storage';

const NETWORK_TABLE = 'networks';

export interface Network {
  name: string;
  type?: 'mainnet' | 'testnet';
  chainID: number;
  RPC: string;
  symbol: string;
  explorer: string;
}

const DEFAULT_NETWORKS: Network[] = [
  {
    name: 'ethereum',
    type: 'mainnet',
    chainID: 1,
    RPC: 'https://ethereum-rpc.publicnode.com',
    symbol: 'ETH',
    explorer: 'https://etherscan.io'
  },
  {
    name: 'sepolia',
    type: 'testnet',
    chainID: 11155111,
    RPC: 'https://sepolia-rpc.publicnode.com',
    symbol: 'SepoliaETH',
    explorer: 'https://sepolia.etherscan.io'
  },
  {
    name: 'zksync',
    type: 'mainnet',
    chainID: 324,
    RPC: 'https://mainnet.era.zksync.io',
    symbol: 'ZK',
    explorer: 'https://zkscan.io'
  }
];

// 初始化默认网络
export async function initDefaultNetworks() {
  const existingKeys = await keys(NETWORK_TABLE);

  if (!existingKeys || existingKeys.length === 0) {
    for (const net of DEFAULT_NETWORKS) {
      await set(net.name, net, NETWORK_TABLE);
    }
    console.log('默认网络已初始化:', DEFAULT_NETWORKS.map(n => n.name));
  } else {
    console.log('网络表已存在，不再初始化默认网络');
  }
}

export async function getAllNetworks(): Promise<Network[]> {
  return await values(NETWORK_TABLE);
}

export async function getAllNetworkNames() {
  return await keys(NETWORK_TABLE);
}

export async function addNetwork(network: Network) {
  await set(network.name, network, NETWORK_TABLE);
}

export async function removeNetwork(name: string) {
  await del(name, NETWORK_TABLE);
}

export async function hasNetwork(name: string): Promise<boolean> {
  const val = await get(name, NETWORK_TABLE);
  return !!val;
}

export async function getNetwork(name: string="ethereum"): Promise<Network | undefined> {
  return await get(name, NETWORK_TABLE);
}
