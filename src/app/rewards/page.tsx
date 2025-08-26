"use client";
import { useMultiPoolStaking } from "@/hooks/useMultiPoolStaking";
import { useAccount } from "wagmi";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import { ETH_PID, ERC20_PID, PoolId, POOL_CONFIGS } from "@/utils";
import { viemClients, defaultChainId } from "@/utils/viem";
import { toast } from "react-toastify";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const RewardsPage = () => {
  const {
    multiPoolData,
    claimRewards,
    getPoolUserData,
    getPoolStatsSummary,
    loading,
    isConnected,
    refreshData,
  } = useMultiPoolStaking();

  const { address, chainId } = useAccount();
  const [claimLoading, setClaimLoading] = useState<{
    [key: string]: boolean;
  }>({});

  const { publicClient } = viemClients(chainId || defaultChainId);

  // 获取池子数据
  const poolStats = getPoolStatsSummary();

  // 计算总的待领取奖励
  const totalPendingRewards = useMemo(() => {
    const ethRewards = poolStats.eth.pendingRewards;
    const erc20Rewards = poolStats.erc20.pendingRewards;
    return ethRewards + erc20Rewards;
  }, [poolStats]);

  // 格式化余额显示
  const formatBalance = (value: bigint | string | undefined, decimals = 18) => {
    if (!value) return "0.0000";
    const stringValue =
      typeof value === "string" ? value : formatUnits(value, decimals);
    const num = parseFloat(stringValue);
    return num.toFixed(4);
  };

  // 检查是否有奖励可领取
  const hasRewardsToClaimFromPool = (poolId: PoolId) => {
    const userData = getPoolUserData(poolId);
    return userData && userData.pendingReward > BigInt(0);
  };

  // 处理单个池子的奖励领取
  const handleClaimFromPool = async (poolId: PoolId) => {
    if (!address) return;

    const poolName = POOL_CONFIGS[poolId].name;
    const loadingKey = poolId.toString();

    try {
      setClaimLoading((prev) => ({ ...prev, [loadingKey]: true }));

      const result = await claimRewards(poolId);

      if (result.success) {
        toast.success(`Claiming rewards from ${poolName}...`);

        // 等待交易确认
        if (result.txHash) {
          const res = await publicClient.waitForTransactionReceipt({
            hash: result.txHash as `0x${string}`,
          });

          if (res.status === "success") {
            toast.success(`Successfully claimed rewards from ${poolName}!`);
            refreshData();
          } else {
            toast.error("Transaction failed");
          }
        }
      } else {
        toast.error(result.error || `Failed to claim from ${poolName}`);
      }
    } catch (error) {
      console.error(`Error claiming from ${poolName}:`, error);
      toast.error("Transaction failed");
    } finally {
      setClaimLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // 处理全部奖励领取
  const handleClaimAll = async () => {
    if (!address) return;

    const poolsWithRewards: PoolId[] = [];
    if (hasRewardsToClaimFromPool(ETH_PID)) poolsWithRewards.push(ETH_PID);
    if (hasRewardsToClaimFromPool(ERC20_PID)) poolsWithRewards.push(ERC20_PID);

    if (poolsWithRewards.length === 0) {
      toast.warning("No rewards available to claim");
      return;
    }

    setClaimLoading((prev) => ({ ...prev, all: true }));

    try {
      // 顺序执行每个池子的领取
      for (const poolId of poolsWithRewards) {
        const result = await claimRewards(poolId);
        if (result.success && result.txHash) {
          await publicClient.waitForTransactionReceipt({
            hash: result.txHash as `0x${string}`,
          });
        }
      }

      toast.success("Successfully claimed all available rewards!");
      refreshData();
    } catch (error) {
      console.error("Error claiming all rewards:", error);
      toast.error("Some claims may have failed");
    } finally {
      setClaimLoading((prev) => ({ ...prev, all: false }));
    }
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading rewards data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* 标题区域 */}
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-6xl font-bold mb-4 text-glow-purple">
          Rewards <span className="text-glow-cyan">Center</span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          🏆 Claim your MetaNode Token rewards from staking pools
        </p>

        {/* 连接状态指示器 */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div
            className={`status-indicator ${
              isConnected ? "status-connected" : "status-disconnected"
            }`}
          ></div>
          <span className="text-sm text-gray-400">
            {isConnected ? "Wallet Connected" : "Wallet Disconnected"}
          </span>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="w-full max-w-6xl space-y-8">
        {/* 奖励总览卡片 */}
        <div className="card-cyber">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">
              🎁 Rewards Overview
            </h2>
            <p className="text-gray-400">
              Your total claimable rewards across all pools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 总奖励 */}
            <div className="data-display border-glow-animation text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-sm text-gray-400 mb-2">Total Rewards</div>
              <div className="text-3xl font-bold text-cyan-400 text-glow">
                {formatBalance(totalPendingRewards)} MTN
              </div>
            </div>

            {/* ETH池奖励 */}
            <div className="data-display text-center">
              <div className="text-3xl mb-2">{POOL_CONFIGS[ETH_PID].icon}</div>
              <div className="text-sm text-gray-400 mb-2">ETH Pool Rewards</div>
              <div className="text-2xl font-bold text-cyan-400">
                {formatBalance(poolStats.eth.pendingRewards)} MTN
              </div>
            </div>

            {/* ERC20池奖励 */}
            <div className="data-display text-center">
              <div className="text-3xl mb-2">
                {POOL_CONFIGS[ERC20_PID].icon}
              </div>
              <div className="text-sm text-gray-400 mb-2">
                MetaNode Pool Rewards
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {formatBalance(poolStats.erc20.pendingRewards)} MTN
              </div>
            </div>
          </div>

          {/* 一键领取全部按钮 */}
          <div className="mt-8 text-center">
            {!isConnected ? (
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            ) : (
              <button
                className={`btn-cyber ${
                  claimLoading.all ? "loading-pulse" : ""
                } ${
                  totalPendingRewards <= BigInt(0)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={handleClaimAll}
                disabled={claimLoading.all || totalPendingRewards <= BigInt(0)}
              >
                {claimLoading.all ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Claiming All...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>🚀</span>
                    {totalPendingRewards > BigInt(0)
                      ? `Claim All Rewards (${formatBalance(
                          totalPendingRewards
                        )} MTN)`
                      : "No Rewards Available"}
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 分池子奖励详情 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ETH池奖励卡片 */}
          <div className="card-cyber">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-cyan-400 mb-2 flex items-center justify-center gap-2">
                {POOL_CONFIGS[ETH_PID].icon} ETH Pool Rewards
              </h3>
              <p className="text-gray-400">Rewards from ETH staking</p>
            </div>

            <div className="space-y-6">
              {/* 奖励显示 */}
              <div className="data-display text-center p-6 border-2 border-cyan-400/30">
                <div className="text-lg text-gray-400 mb-2">
                  Available Rewards
                </div>
                <div className="text-4xl font-bold text-cyan-400 text-glow mb-4">
                  {formatBalance(poolStats.eth.pendingRewards)} MTN
                </div>
                <div className="text-sm text-gray-500">
                  From {formatBalance(poolStats.eth.staked)} ETH staked
                </div>
              </div>

              {/* 质押信息 */}
              <div className="data-display text-center">
                <div className="text-sm text-gray-400 mb-2">Your ETH Stake</div>
                <div className="text-xl font-bold text-cyan-400">
                  {formatBalance(poolStats.eth.staked)} ETH
                </div>
              </div>

              {/* 领取按钮 */}
              <button
                className={`w-full btn-cyber-secondary ${
                  claimLoading[ETH_PID.toString()] ? "loading-pulse" : ""
                } ${
                  !hasRewardsToClaimFromPool(ETH_PID)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() => handleClaimFromPool(ETH_PID)}
                disabled={
                  !isConnected ||
                  claimLoading[ETH_PID.toString()] ||
                  !hasRewardsToClaimFromPool(ETH_PID)
                }
              >
                {claimLoading[ETH_PID.toString()] ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Claiming...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>🏆</span>
                    {hasRewardsToClaimFromPool(ETH_PID)
                      ? "Claim ETH Pool Rewards"
                      : "No Rewards Available"}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* ERC20池奖励卡片 */}
          <div className="card-cyber">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-purple-400 mb-2 flex items-center justify-center gap-2">
                {POOL_CONFIGS[ERC20_PID].icon} MetaNode Pool Rewards
              </h3>
              <p className="text-gray-400">
                Rewards from MetaNode Token staking
              </p>
            </div>

            <div className="space-y-6">
              {/* 奖励显示 */}
              <div className="data-display text-center p-6 border-2 border-purple-400/30">
                <div className="text-lg text-gray-400 mb-2">
                  Available Rewards
                </div>
                <div className="text-4xl font-bold text-purple-400 text-glow mb-4">
                  {formatBalance(poolStats.erc20.pendingRewards)} MTN
                </div>
                <div className="text-sm text-gray-500">
                  From {formatBalance(poolStats.erc20.staked)} MTN staked
                </div>
              </div>

              {/* 质押信息 */}
              <div className="data-display text-center">
                <div className="text-sm text-gray-400 mb-2">Your MTN Stake</div>
                <div className="text-xl font-bold text-purple-400">
                  {formatBalance(poolStats.erc20.staked)} MTN
                </div>
              </div>

              {/* 领取按钮 */}
              <button
                className={`w-full btn-cyber-secondary ${
                  claimLoading[ERC20_PID.toString()] ? "loading-pulse" : ""
                } ${
                  !hasRewardsToClaimFromPool(ERC20_PID)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() => handleClaimFromPool(ERC20_PID)}
                disabled={
                  !isConnected ||
                  claimLoading[ERC20_PID.toString()] ||
                  !hasRewardsToClaimFromPool(ERC20_PID)
                }
              >
                {claimLoading[ERC20_PID.toString()] ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Claiming...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>🏆</span>
                    {hasRewardsToClaimFromPool(ERC20_PID)
                      ? "Claim MetaNode Pool Rewards"
                      : "No Rewards Available"}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 奖励说明 */}
        <div className="card-cyber">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-cyan-400">
              📚 About Rewards
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl mb-3">🪙</div>
              <h4 className="text-lg font-bold text-cyan-400 mb-2">
                MetaNode Token
              </h4>
              <p className="text-sm text-gray-400">
                All rewards are paid in MetaNode Token (MTN), regardless of
                which pool you stake in
              </p>
            </div>

            <div className="text-center p-4">
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="text-lg font-bold text-yellow-400 mb-2">
                Real-time Rewards
              </h4>
              <p className="text-sm text-gray-400">
                Rewards are calculated in real-time based on your staking amount
                and duration
              </p>
            </div>

            <div className="text-center p-4">
              <div className="text-3xl mb-3">🔄</div>
              <h4 className="text-lg font-bold text-green-400 mb-2">
                Auto-Compound
              </h4>
              <p className="text-sm text-gray-400">
                Claimed rewards can be restaked to earn more rewards through
                compound interest
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;
