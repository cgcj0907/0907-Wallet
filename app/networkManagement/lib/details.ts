export const TOKEN_LIST: Record<string, string[]> = {
  ethereum: ['ethereum', 'usdt', 'usdc', 'dai', 'uni', 'aave', 'steth' ],
  sepolia: ['sepolia'],
  zksync: ['zksync'],
};

/**
 * 本地图标映射：
 */
export const TOKEN_ICON_MAP: Record<string, string> = {
  ethereum: 'eth.png',
  usdt: 'usdt.svg',
  usdc: 'usdc.svg',
  dai: 'dai.svg',
  uni: 'uni.svg',
  aave: 'aave.svg',
  sepolia: 'eth.png',
  zksync: 'zk.png',
  steth: 'steth.svg'
};

/**
 * 展示用简称（symbol）
 */
export const TOKEN_SYMBOL_MAP: Record<string, string> = {
  ethereum: 'ETH',
  usdt: 'USDT',
  usdc: 'USDC',
  dai: 'DAI',
  uni: 'UNI',
  aave: 'AAVE',
  sepolia: 'ETH',
  zksync: 'ZK',
  steth: 'STETH',
};

/**
 * 小数位映射，用来把原始整数（最小单位）转换为可读数量
 * 根据实际 token 调整（常见：ETH/DAI/UNI/AAVE 18，USDT/USDC 6）
 */
export const DECIMALS: Record<string, number> = {
  ethereum: 18,
  usdt: 6,
  usdc: 6,
  dai: 18,
  uni: 18,
  aave: 18,
  sepolia: 18,
  zksync: 18,
  steth: 18,
};

export const LAYER2_LIST: string[] = ['zksync'];

export const ERC20TOKEN_LIST: Record<string, string[]> = {
  ethereum: ['usdt', 'usdc', 'dai', 'uni', 'aave', 'steth'],
  zksync: ['zksync']
};

export const NATIVE_TOKEN: Record<string, string> = {
  ethereum: "ETH",
  sepolia: "ETH",
  zksync: "ZK"
}

export const EXPLORER_MAP: Record<string, string> = {
  ethereum: 'https://etherscan.io/tx/',
  sepolia: 'https://sepolia.etherscan.io/tx/',
  zksync: 'https://explorer.zksync.io/tx/',
};

export const CHAIN_ID: Record<string, number> = {
  ethereum: 1,
  sepolia: 11155111,
  zksync: 324,
};

export const ETHEREUM_TOKEN_ADDRESS: Record<string, string> = {
  ethereum: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  aave: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
  usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  uni: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  steth: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
}