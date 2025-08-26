// 池子ID常量
export const ETH_PID = 0;
export const ERC20_PID = 1;

// 兼容性支持
export const Pid = ETH_PID; // 保持向后兼容

// 池子配置
export const POOL_CONFIG = {
  [ETH_PID]: {
    name: "ETH Pool",
    symbol: "ETH",
    decimals: 18,
    isNative: true,
    tokenAddress: "0x0000000000000000000000000000000000000000", // ETH使用零地址
  },
  [ERC20_PID]: {
    name: "MetaNode Pool",
    symbol: "MNT",
    decimals: 18,
    isNative: false,
    tokenAddress: process.env.NEXT_PUBLIC_ERC20_ADDRESS,
  },
} as const;

// 池子类型
export type PoolId = typeof ETH_PID | typeof ERC20_PID;

// 获取池子配置的工具函数
export const getPoolConfig = (poolId: PoolId) => {
  return POOL_CONFIG[poolId];
};

// 检查是否为原生代币池子
export const isNativePool = (poolId: PoolId) => {
  return POOL_CONFIG[poolId].isNative;
};

// 获取所有池子ID
export const getAllPoolIds = (): PoolId[] => {
  return [ETH_PID, ERC20_PID];
};
