import {
  type Abi,
  type Address,
  type PublicClient,
  type WalletClient,
  type Account,
  getContract as viemGetContract,
} from "viem";
import { defaultChainId, viemClients } from "./viem";

// 合约配置接口
export interface ContractConfig {
  abi: Abi;
  address: Address;
  chainId?: number;
}

/**
 * 获取合约实例
 * @param config 合约配置
 * @returns 合约实例
 */
export const getContract = (config: ContractConfig) => {
  const { abi, address, chainId = defaultChainId } = config;

  const { publicClient, walletClient } = viemClients(chainId);

  const contract = viemGetContract({
    abi,
    address,
    client: {
      public: publicClient as PublicClient,
      wallet: walletClient as WalletClient,
    },
  });

  return {
    ...contract,
    address,
    abi,
    publicClient,
    walletClient,
  };
};
