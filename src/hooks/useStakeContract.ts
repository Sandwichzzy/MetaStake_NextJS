import { useCallback, useMemo, useState, useEffect } from "react";
import { type Address } from "viem";
import { getContract } from "../utils/contractHelper";
import { stakeAbi } from "../abis/stake";
import { sepolia } from "viem/chains";
import { ETH_PID, ERC20_PID, PoolId, getPoolConfig } from "../utils";

// 合约地址类型
type StakeContractAddress = Address;

// 用户质押数据类型
export type UserStakeData = {
  poolId: PoolId;
  staked: bigint;
  pendingReward: bigint;
  withdrawPending: bigint;
  withdrawable: bigint;
};

// 池子信息类型
export type PoolInfo = {
  poolId: PoolId;
  stTokenAddress: Address;
  poolWeight: bigint;
  lastRewardBlock: bigint;
  accMetaNodePerST: bigint;
  stTokenAmount: bigint;
  minDepositAmount: bigint;
  unstakeLockedBlocks: bigint;
};

// 使用合约的Hook
export const useStakeContract = (contractAddress?: StakeContractAddress) => {
  // 默认合约地址
  const address = useMemo(
    () =>
      contractAddress ||
      (process.env.NEXT_PUBLIC_STAKE_ADDRESS as StakeContractAddress),
    [contractAddress]
  );

  // 合约实例状态
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化合约实例
  useEffect(() => {
    const initContract = async () => {
      if (!address) {
        setError("Contract address is required");
        setLoading(false);
        return;
      }

      // 服务端渲染保护
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const contractInstance = await getContract({
          abi: stakeAbi,
          address: address,
          chainId: sepolia.id,
        });
        setContract(contractInstance);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize contract"
        );
        console.error("Contract initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initContract();
  }, [address]);

  // 获取合约实例
  const getStakeContract = useCallback(() => {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    return contract;
  }, [contract]);

  // 读取合约数据的函数
  const readContractData = useCallback(
    async (functionName: string, args: any[] = []) => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      try {
        return await contract.read[functionName](args);
      } catch (error) {
        console.error(`Error reading ${functionName}:`, error);
        throw error;
      }
    },
    [contract]
  );

  // 写入合约数据的函数
  const writeContractData = useCallback(
    async (
      functionName: string,
      args: any[] = [],
      account: `0x${string}`,
      value?: bigint
    ) => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      try {
        return await contract.writeContract({
          functionName,
          args,
          value,
          account,
        });
      } catch (error) {
        console.error(`Error writing ${functionName}:`, error);
        throw error;
      }
    },
    [contract]
  );

  // 具体的合约函数

  // 读取操作
  const getPoolLength = useCallback(async () => {
    return await readContractData("poolLength");
  }, [readContractData]);

  const getPool = useCallback(
    async (poolId: number): Promise<PoolInfo> => {
      const poolData = await readContractData("pool", [poolId]);
      return {
        poolId: poolId as PoolId,
        stTokenAddress: poolData[0],
        poolWeight: poolData[1],
        lastRewardBlock: poolData[2],
        accMetaNodePerST: poolData[3],
        stTokenAmount: poolData[4],
        minDepositAmount: poolData[5],
        unstakeLockedBlocks: poolData[6],
      };
    },
    [readContractData]
  );

  const getUserInfo = useCallback(
    async (poolId: number, user: Address) => {
      return await readContractData("user", [poolId, user]);
    },
    [readContractData]
  );

  const getPendingReward = useCallback(
    async (poolId: number, user: Address) => {
      return await readContractData("pendingMetaNode", [poolId, user]);
    },
    [readContractData]
  );

  const getStakingBalance = useCallback(
    async (poolId: number, user: Address) => {
      return await readContractData("stakingBalance", [poolId, user]);
    },
    [readContractData]
  );

  const getWithdrawAmount = useCallback(
    async (poolId: number, user: Address) => {
      return await readContractData("withdrawAmount", [poolId, user]);
    },
    [readContractData]
  );

  const getTotalPoolWeight = useCallback(async () => {
    return await readContractData("totalPoolWeight");
  }, [readContractData]);

  const getMetaNodeAddress = useCallback(async () => {
    return await readContractData("MetaNode");
  }, [readContractData]);

  const getMetaNodePerBlock = useCallback(async () => {
    return await readContractData("MetaNodePerBlock");
  }, [readContractData]);

  const isPaused = useCallback(async () => {
    return await readContractData("paused");
  }, [readContractData]);

  const isClaimPaused = useCallback(async () => {
    return await readContractData("claimPaused");
  }, [readContractData]);

  const isWithdrawPaused = useCallback(async () => {
    return await readContractData("withdrawPaused");
  }, [readContractData]);

  // 写入操作
  const deposit = useCallback(
    async (poolId: number, amount: bigint, account: `0x${string}`) => {
      return await writeContractData("deposit", [poolId, amount], account);
    },
    [writeContractData]
  );

  const depositETH = useCallback(
    async (value: bigint, account: `0x${string}`) => {
      return await writeContractData("depositETH", [], account, value);
    },
    [writeContractData]
  );

  const claim = useCallback(
    async (poolId: number, account: `0x${string}`) => {
      return await writeContractData("claim", [poolId], account);
    },
    [writeContractData]
  );

  const requestUnstake = useCallback(
    async (poolId: number, amount: bigint, account: `0x${string}`) => {
      return await writeContractData("unstake", [poolId, amount], account);
    },
    [writeContractData]
  );

  const withdraw = useCallback(
    async (poolId: number, account: `0x${string}`) => {
      return await writeContractData("withdraw", [poolId], account);
    },
    [writeContractData]
  );

  const updatePool = useCallback(
    async (poolId: number, account: `0x${string}`) => {
      return await writeContractData("updatePool", [poolId], account);
    },
    [writeContractData]
  );

  // 批量读取操作
  const batchRead = useCallback(
    async (calls: Array<{ functionName: string; args?: any[] }>) => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      try {
        const promises = calls.map((call) => {
          const readFn = contract.read[
            call.functionName as keyof typeof contract.read
          ] as any;
          return readFn(call.args || []);
        });
        return await Promise.all(promises);
      } catch (error) {
        console.error("Error in batch read:", error);
        throw error;
      }
    },
    [contract]
  );

  // 获取合约状态摘要
  const getContractStatus = useCallback(async () => {
    try {
      const [poolLength, totalWeight, isPausedStatus, metaNodeAddress] =
        await batchRead([
          { functionName: "poolLength" },
          { functionName: "totalPoolWeight" },
          { functionName: "paused" },
          { functionName: "MetaNode" },
        ]);

      return {
        poolLength,
        totalWeight,
        isPaused: isPausedStatus,
        metaNodeAddress,
      };
    } catch (error) {
      console.error("Error getting contract status:", error);
      throw error;
    }
  }, [batchRead]);

  // 获取用户质押摘要（单个池子）
  const getUserStakingSummary = useCallback(
    async (poolId: number, user: Address): Promise<UserStakeData> => {
      try {
        const [balance, pendingReward, withdrawInfo] = await batchRead([
          { functionName: "stakingBalance", args: [poolId, user] },
          { functionName: "pendingMetaNode", args: [poolId, user] },
          { functionName: "withdrawAmount", args: [poolId, user] },
        ]);

        const [requestAmount, pendingWithdrawAmount] = withdrawInfo as [
          bigint,
          bigint
        ];

        return {
          poolId: poolId as PoolId,
          staked: balance as bigint,
          pendingReward: pendingReward as bigint,
          withdrawPending: requestAmount - pendingWithdrawAmount,
          withdrawable: pendingWithdrawAmount,
        };
      } catch (error) {
        console.error("Error getting user staking summary:", error);
        throw error;
      }
    },
    [batchRead]
  );

  // 获取用户所有池子的质押摘要
  const getAllUserStakingSummary = useCallback(
    async (user: Address): Promise<UserStakeData[]> => {
      try {
        // 获取两个池子的数据
        const [ethSummary, erc20Summary] = await Promise.all([
          getUserStakingSummary(ETH_PID, user),
          getUserStakingSummary(ERC20_PID, user),
        ]);

        return [ethSummary, erc20Summary];
      } catch (error) {
        console.error("Error getting all user staking summary:", error);
        throw error;
      }
    },
    [getUserStakingSummary]
  );

  // 获取所有池子信息
  const getAllPoolsInfo = useCallback(async (): Promise<PoolInfo[]> => {
    try {
      const [ethPool, erc20Pool] = await Promise.all([
        getPool(ETH_PID),
        getPool(ERC20_PID),
      ]);

      return [ethPool, erc20Pool];
    } catch (error) {
      console.error("Error getting all pools info:", error);
      throw error;
    }
  }, [getPool]);

  // 便捷的质押方法（根据池子类型自动选择）
  const stakeToPool = useCallback(
    async (poolId: PoolId, amount: bigint, account: `0x${string}`) => {
      const poolConfig = getPoolConfig(poolId);

      if (poolConfig.isETH) {
        // ETH池使用depositETH
        return await depositETH(amount, account);
      } else {
        // ERC20池使用deposit
        return await deposit(poolId, amount, account);
      }
    },
    [depositETH, deposit]
  );

  return {
    // 合约实例和状态
    contract,
    loading,
    error,

    // 合约实例获取器
    getStakeContract,

    // 读取操作
    getPoolLength,
    getPool,
    getUserInfo,
    getPendingReward,
    getStakingBalance,
    getWithdrawAmount,
    getTotalPoolWeight,
    getMetaNodeAddress,
    getMetaNodePerBlock,
    isPaused,
    isClaimPaused,
    isWithdrawPaused,

    // 写入操作
    deposit,
    depositETH,
    claim,
    requestUnstake,
    withdraw,
    updatePool,
    stakeToPool, // 新增的便捷质押方法

    // 批量操作
    batchRead,
    getContractStatus,
    getUserStakingSummary,
    getAllUserStakingSummary, // 新增
    getAllPoolsInfo, // 新增

    // 合约地址
    address: address,
  };
};
