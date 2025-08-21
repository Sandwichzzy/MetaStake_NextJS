import {
  type PublicClient,
  type WalletClient,
  type Chain,
  createPublicClient as viemCreatePublicClient,
  createWalletClient as viemCreateWalletClient,
  http,
} from "viem";
import { sepolia, mainnet } from "viem/chains";

// 默认链ID
export const defaultChainId = sepolia.id;

// 客户端配置类型
export interface ViemClientConfig {
  chain: Chain;
  rpcUrl: string;
}

// 链配置
const CHAIN_CONFIGS: ViemClientConfig[] = [
  {
    chain: sepolia,
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/56HjACR3rieEsXnBAsET7",
  },
  {
    chain: mainnet,
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/56HjACR3rieEsXnBAsET7",
  },
];

/**
 * 根据链ID获取链配置
 * @param chainId 链ID
 * @returns 链配置
 */
export const getChainConfig = (chainId: number): ViemClientConfig => {
  const chainConfig = CHAIN_CONFIGS.find(
    (config) => config.chain.id === chainId
  );
  if (!chainConfig) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return chainConfig;
};

/**
 * 检查链是否支持
 * @param chainId 链ID
 * @returns 是否支持
 */
export const isChainSupported = (chainId: number): boolean => {
  return CHAIN_CONFIGS.some((config) => config.chain.id === chainId);
};

/**
 * 创建区块链客户端
 * @param chainId 链ID
 * @param account 可选账户信息
 * @returns 公共客户端和钱包客户端
 */
export const viemClients = (
  chainId: number,
  account?: `0x${string}`
): {
  publicClient: PublicClient;
  walletClient: WalletClient;
} => {
  const { chain, rpcUrl } = getChainConfig(chainId);

  const publicClient = viemCreatePublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = viemCreateWalletClient({
    chain,
    transport: http(rpcUrl),
    ...(account && { account }),
  });

  return { publicClient, walletClient };
};
