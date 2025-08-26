import { useCallback, useState, useEffect } from "react";
import { type Address } from "viem";
import { useAccount } from "wagmi";
import { useStakeContract, UserStakeData, PoolInfo } from "./useStakeContract";
import { useERC20Contract } from "./useERC20Contract";
import {
  ETH_PID,
  ERC20_PID,
  PoolId,
  getPoolConfig,
  isETHPool,
  isERC20Pool,
  POOL_CONFIGS,
} from "../utils";

// 获取ERC20代币地址
const ERC20_TOKEN_ADDRESS = POOL_CONFIGS[ERC20_PID].tokenAddress;

// 多池子数据类型
export type MultiPoolData = {
  pools: PoolInfo[];
  userStakingData: UserStakeData[];
  tokenInfo?: {
    name: string;
    symbol: string;
    decimals: number;
    balance: bigint;
    allowance: bigint;
  };
  loading: boolean;
  error: string | null;
};

// 质押操作结果类型
export type StakeOperationResult = {
  success: boolean;
  txHash?: string;
  error?: string;
  needsApproval?: boolean;
};

/**
 * 多池子质押管理Hook
 */
export const useMultiPoolStaking = () => {
  const { address, isConnected } = useAccount();

  // 合约实例
  const stakeContract = useStakeContract();
  const erc20Contract = useERC20Contract(ERC20_TOKEN_ADDRESS as Address);

  // 状态管理
  const [multiPoolData, setMultiPoolData] = useState<MultiPoolData>({
    pools: [],
    userStakingData: [],
    loading: true,
    error: null,
  });

  // 获取所有数据 - 使用稳定的函数引用作为依赖
  const fetchAllData = useCallback(async () => {
    if (
      !address ||
      !isConnected ||
      stakeContract.loading ||
      erc20Contract.loading ||
      !stakeContract.contract ||
      !erc20Contract.contract
    ) {
      return;
    }

    try {
      setMultiPoolData((prev) => ({ ...prev, loading: true, error: null }));

      // 并行获取所有数据
      const [poolsInfo, userStakingData, userTokenInfo, basicTokenInfo] =
        await Promise.all([
          stakeContract.getAllPoolsInfo(),
          stakeContract.getAllUserStakingSummary(address),
          erc20Contract.getUserTokenInfo(address, stakeContract.address),
          erc20Contract.getTokenInfo(),
        ]);

      // 合并代币信息
      const tokenInfo = {
        ...basicTokenInfo,
        balance: userTokenInfo.balance,
        allowance: userTokenInfo.allowance,
      };

      setMultiPoolData({
        pools: poolsInfo,
        userStakingData,
        tokenInfo,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching multi-pool data:", error);
      setMultiPoolData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch data",
      }));
    }
  }, [
    address,
    isConnected,
    stakeContract.loading,
    stakeContract.contract,
    stakeContract.getAllPoolsInfo,
    stakeContract.getAllUserStakingSummary,
    stakeContract.address,
    erc20Contract.loading,
    erc20Contract.contract,
    erc20Contract.getUserTokenInfo,
    erc20Contract.getTokenInfo,
  ]);

  // 初始化和定期刷新数据
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 检查ERC20代币授权状态
  const checkERC20Allowance = useCallback(
    async (amount: bigint): Promise<boolean> => {
      if (!address || !stakeContract.address || !erc20Contract.contract) {
        return false;
      }

      try {
        const allowance = await erc20Contract.getAllowance(
          address,
          stakeContract.address
        );
        return allowance >= amount;
      } catch (error) {
        console.error("Error checking allowance:", error);
        return false;
      }
    },
    [
      address,
      stakeContract.address,
      erc20Contract.contract,
      erc20Contract.getAllowance,
    ]
  );

  // 授权ERC20代币
  const approveERC20 = useCallback(
    async (amount: bigint): Promise<StakeOperationResult> => {
      if (!address || !stakeContract.address || !erc20Contract.contract) {
        return { success: false, error: "Contract not initialized" };
      }

      try {
        const txHash = await erc20Contract.approve(
          stakeContract.address,
          amount,
          address
        );

        return { success: true, txHash };
      } catch (error) {
        console.error("Error approving ERC20:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Approval failed",
        };
      }
    },
    [
      address,
      stakeContract.address,
      erc20Contract.contract,
      erc20Contract.approve,
    ]
  );

  // 质押到指定池子
  const stakeToPool = useCallback(
    async (poolId: PoolId, amount: bigint): Promise<StakeOperationResult> => {
      if (!address) {
        return { success: false, error: "Wallet not connected" };
      }

      try {
        // 检查是否是ERC20池子且需要授权
        if (isERC20Pool(poolId)) {
          const hasEnoughAllowance = await checkERC20Allowance(amount);
          if (!hasEnoughAllowance) {
            return { success: false, needsApproval: true };
          }
        }

        // 执行质押
        const txHash = await stakeContract.stakeToPool(poolId, amount, address);

        // 刷新数据
        setTimeout(() => {
          fetchAllData();
        }, 2000);

        return { success: true, txHash };
      } catch (error) {
        console.error("Error staking to pool:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Staking failed",
        };
      }
    },
    [address, checkERC20Allowance, stakeContract.stakeToPool, fetchAllData]
  );

  // 解除质押
  const unstakeFromPool = useCallback(
    async (poolId: PoolId, amount: bigint): Promise<StakeOperationResult> => {
      if (!address) {
        return { success: false, error: "Wallet not connected" };
      }

      try {
        const txHash = await stakeContract.requestUnstake(
          poolId,
          amount,
          address
        );

        // 刷新数据
        setTimeout(() => {
          fetchAllData();
        }, 2000);

        return { success: true, txHash };
      } catch (error) {
        console.error("Error unstaking from pool:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unstaking failed",
        };
      }
    },
    [address, stakeContract.requestUnstake, fetchAllData]
  );

  // 提现
  const withdrawFromPool = useCallback(
    async (poolId: PoolId): Promise<StakeOperationResult> => {
      if (!address) {
        return { success: false, error: "Wallet not connected" };
      }

      try {
        const txHash = await stakeContract.withdraw(poolId, address);

        // 刷新数据
        setTimeout(() => {
          fetchAllData();
        }, 2000);

        return { success: true, txHash };
      } catch (error) {
        console.error("Error withdrawing from pool:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Withdrawal failed",
        };
      }
    },
    [address, stakeContract.withdraw, fetchAllData]
  );

  // 领取奖励
  const claimRewards = useCallback(
    async (poolId: PoolId): Promise<StakeOperationResult> => {
      if (!address) {
        return { success: false, error: "Wallet not connected" };
      }

      try {
        const txHash = await stakeContract.claim(poolId, address);

        // 刷新数据
        setTimeout(() => {
          fetchAllData();
        }, 2000);

        return { success: true, txHash };
      } catch (error) {
        console.error("Error claiming rewards:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Claim failed",
        };
      }
    },
    [address, stakeContract.claim, fetchAllData]
  );

  // 获取指定池子的用户数据
  const getPoolUserData = useCallback(
    (poolId: PoolId): UserStakeData | undefined => {
      return multiPoolData.userStakingData.find(
        (data) => data.poolId === poolId
      );
    },
    [multiPoolData.userStakingData]
  );

  // 获取指定池子的信息
  const getPoolInfo = useCallback(
    (poolId: PoolId): PoolInfo | undefined => {
      return multiPoolData.pools.find((pool) => pool.poolId === poolId);
    },
    [multiPoolData.pools]
  );

  // 按池子类型分别计算统计数据
  const getETHStaked = useCallback(() => {
    const ethData = multiPoolData.userStakingData.find(
      (data) => data.poolId === ETH_PID
    );
    return ethData?.staked || BigInt(0);
  }, [multiPoolData.userStakingData]);

  const getERC20Staked = useCallback(() => {
    const erc20Data = multiPoolData.userStakingData.find(
      (data) => data.poolId === ERC20_PID
    );
    return erc20Data?.staked || BigInt(0);
  }, [multiPoolData.userStakingData]);

  const getETHPendingRewards = useCallback(() => {
    const ethData = multiPoolData.userStakingData.find(
      (data) => data.poolId === ETH_PID
    );
    return ethData?.pendingReward || BigInt(0);
  }, [multiPoolData.userStakingData]);

  const getERC20PendingRewards = useCallback(() => {
    const erc20Data = multiPoolData.userStakingData.find(
      (data) => data.poolId === ERC20_PID
    );
    return erc20Data?.pendingReward || BigInt(0);
  }, [multiPoolData.userStakingData]);

  // 获取分池子的提现统计
  const getETHWithdrawStats = useCallback(() => {
    const ethData = multiPoolData.userStakingData.find(
      (data) => data.poolId === ETH_PID
    );
    return {
      withdrawPending: ethData?.withdrawPending || BigInt(0),
      withdrawable: ethData?.withdrawable || BigInt(0),
    };
  }, [multiPoolData.userStakingData]);

  const getERC20WithdrawStats = useCallback(() => {
    const erc20Data = multiPoolData.userStakingData.find(
      (data) => data.poolId === ERC20_PID
    );
    return {
      withdrawPending: erc20Data?.withdrawPending || BigInt(0),
      withdrawable: erc20Data?.withdrawable || BigInt(0),
    };
  }, [multiPoolData.userStakingData]);

  // 获取完整的池子统计汇总
  const getPoolStatsSummary = useCallback(() => {
    return {
      eth: {
        staked: getETHStaked(),
        pendingRewards: getETHPendingRewards(),
        withdrawStats: getETHWithdrawStats(),
        poolConfig: POOL_CONFIGS[ETH_PID],
      },
      erc20: {
        staked: getERC20Staked(),
        pendingRewards: getERC20PendingRewards(),
        withdrawStats: getERC20WithdrawStats(),
        poolConfig: POOL_CONFIGS[ERC20_PID],
      },
    };
  }, [
    getETHStaked,
    getETHPendingRewards,
    getETHWithdrawStats,
    getERC20Staked,
    getERC20PendingRewards,
    getERC20WithdrawStats,
  ]);

  return {
    // 数据
    multiPoolData,

    // 池子特定数据获取
    getPoolUserData,
    getPoolInfo,

    // 分池子统计数据
    getETHStaked,
    getERC20Staked,
    getETHPendingRewards,
    getERC20PendingRewards,
    getETHWithdrawStats,
    getERC20WithdrawStats,

    // 汇总统计数据
    getPoolStatsSummary,

    // 操作方法
    stakeToPool,
    unstakeFromPool,
    withdrawFromPool,
    claimRewards,
    approveERC20,
    checkERC20Allowance,

    // 工具方法
    refreshData: fetchAllData,

    // 状态
    loading:
      multiPoolData.loading || stakeContract.loading || erc20Contract.loading,
    error: multiPoolData.error || stakeContract.error || erc20Contract.error,
    isConnected,
    userAddress: address,
  };
};
