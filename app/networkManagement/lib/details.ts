export const TOKEN_LIST: Record<string, string[]> = {
  ethereum: ['ethereum', 'USDT', 'USDC', 'DAI', 'UNI', 'AAVE' ],
  sepolia: ['sepolia'],
  zksync: ['zksync'],
};

/**
 * 本地图标映射：
 */
export const TOKEN_ICON_MAP: Record<string, string> = {
  ethereum: 'eth.png',
  USDT: 'usdt.svg',
  USDC: 'usdc.svg',
  DAI: 'dai.svg',
  UNI: 'uni.svg',
  AAVE: 'aave.svg',
  sepolia: 'eth.png',
  zksync: 'zk.png',
};

/**
 * 展示用简称（symbol）
 */
export const TOKEN_SYMBOL_MAP: Record<string, string> = {
  ethereum: 'ETH',
  USDT: 'USDT',
  USDC: 'USDC',
  DAI: 'DAI',
  UNI: 'UNI',
  AAVE: 'AAVE',
  sepolia: 'ETH',
  zksync: 'ZK',
};

/**
 * 小数位映射，用来把原始整数（最小单位）转换为可读数量
 * 根据实际 token 调整（常见：ETH/DAI/UNI/AAVE 18，USDT/USDC 6）
 */
export const DECIMALS: Record<string, number> = {
  ethereum: 18,
  USDT: 6,
  USDC: 6,
  DAI: 18,
  UNI: 18,
  AAVE: 18,
  sepolia: 18,
  zksync: 18,
};

export const LAYER2_LIST: string[] = ['zksync'];

export const ERC20TOKEN_LIST: Record<string, string[]> = {
  ethereum: ['USDT', 'USDC', 'DAI', 'UNI', 'AAVE'],
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