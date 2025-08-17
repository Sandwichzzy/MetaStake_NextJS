import { useMemo } from "react";
import { type Address, type Abi } from "viem";
import { useChainId } from "wagmi";
import { getContract } from "../utils/contractHelper";
import { stakeAbi } from "../abis/stake";
import { defaultChainId } from "../utils/viem";

// 使用合约的Hook
export const useContract = (
  contractAddress?: Address,
  abi?: Abi,
  chainId?: number
) => {
  const currentChainId = useChainId();
  const usechainId = chainId || currentChainId;
  // 获取合约实例
  return useMemo(() => {
    if (!contractAddress || !abi || !usechainId) {
      return null;
    }
    return getContract({
      abi,
      address: contractAddress,
      chainId: usechainId,
    });
  }, [contractAddress, abi]);
};

export const useStakeContract = () => {
  // 默认合约地址
  const stakeContractAddress = process.env.NEXT_PUBLIC_STAKE_ADDRESS as Address;
  return useContract(stakeContractAddress, stakeAbi as Abi, defaultChainId);
};
