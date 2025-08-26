// 池子常量定义
export const ETH_PID = 0;
export const ERC20_PID = 1;

// 保持向后兼容
export const Pid = ETH_PID;

// 池子配置
export const POOL_CONFIGS = {
  [ETH_PID]: {
    name: "ETH Pool",
    symbol: "ETH",
    tokenAddress: "0x0000000000000000000000000000000000000000", // ETH使用零地址
    decimals: 18,
    icon: "⚡",
    color: "cyan",
    isETH: true,
  },
  [ERC20_PID]: {
    name: "MetaNode Token Pool",
    symbol: "MTN",
    tokenAddress: "0xcF48c309E7e57D5965E4b8DcCe2c5e2Ae59c9d19",
    decimals: 18,
    icon: "🚀",
    color: "purple",
    isETH: false,
  },
} as const;

// 类型定义
export type PoolId = typeof ETH_PID | typeof ERC20_PID;
export type PoolConfig = (typeof POOL_CONFIGS)[PoolId];

// 工具函数
export const getPoolConfig = (poolId: PoolId): PoolConfig => {
  return POOL_CONFIGS[poolId];
};

export const isETHPool = (poolId: PoolId): boolean => {
  return poolId === ETH_PID;
};

export const isERC20Pool = (poolId: PoolId): boolean => {
  return poolId === ERC20_PID;
};
