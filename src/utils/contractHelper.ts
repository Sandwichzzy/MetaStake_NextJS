import {
  type Abi,
  type Address,
  type PublicClient,
  type WalletClient,
  type Account,
  getContract as viemGetContract,
  type WriteContractParameters,
} from "viem";
import { defaultChainId, getChainConfig, viemClients } from "./viem";

// 合约配置接口
export interface ContractConfig {
  abi: Abi;
  address: Address;
  chainId?: number;
}

// 写合约配置接口
export interface WriteContractConfig {
  functionName: string;
  args: unknown[];
  value?: bigint;
  account: `0x${string}`;
}

// 合约实例接口
export interface ContractInstance {
  address: Address;
  abi: Abi;
  publicClient: PublicClient;
  walletClient: WalletClient;
  read: any;
  write: any;
  writeContract: (config: WriteContractConfig) => Promise<`0x${string}`>;
}

/**
 * 获取合约实例
 * @param config 合约配置
 * @returns 合约实例
 */
export const getContract = async (
  config: ContractConfig
): Promise<ContractInstance> => {
  const { abi, address, chainId = defaultChainId } = config;
  const { publicClient, walletClient } = viemClients(chainId);

  const contract = viemGetContract({
    abi,
    address,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
  });

  /**
   * 封装写合约方法
   * @param config 写合约配置
   * @returns 交易哈希
   */
  const writeContract = async (
    config: WriteContractConfig
  ): Promise<`0x${string}`> => {
    const { functionName, args, value, account } = config;
    try {
      // 写合约之前先模拟执行
      const simulateParams = {
        address: address as Address,
        abi: contract.abi as Abi,
        functionName,
        args,
        value,
        account,
      };

      await publicClient.simulateContract(simulateParams);
      console.log(simulateParams, "simulateParams");
      // 执行写合约
      const tx = await walletClient.writeContract({
        ...simulateParams,
        chain: getChainConfig(chainId).chain,
      });
      return tx;
    } catch (error) {
      console.error(`Error in writeContract for ${functionName}:`, error);
      throw error;
    }
  };

  return {
    ...contract,
    address,
    abi,
    publicClient,
    walletClient,
    writeContract,
  };
};
