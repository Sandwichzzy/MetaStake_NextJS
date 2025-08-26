"use client";
import { useMultiPoolStaking } from "@/hooks/useMultiPoolStaking";
import { useAccount } from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { ETH_PID, ERC20_PID, PoolId, POOL_CONFIGS } from "@/utils";
import { viemClients, defaultChainId } from "@/utils/viem";
import { toast } from "react-toastify";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const WithdrawPage = () => {
  const {
    multiPoolData,
    unstakeFromPool,
    withdrawFromPool,
    getPoolUserData,
    getPoolStatsSummary,
    loading,
    error,
    isConnected,
    refreshData,
  } = useMultiPoolStaking();

  const { address, chainId } = useAccount();
  const [selectedPoolId, setSelectedPoolId] = useState<PoolId>(ETH_PID);
  const [unstakeAmount, setUnstakeAmount] = useState("0");
  const [unstakeLoading, setUnstakeLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const { publicClient } = viemClients(chainId || defaultChainId);

  // 获取当前选中池子的配置
  const currentPoolConfig = POOL_CONFIGS[selectedPoolId];
  const isCurrentPoolETH = selectedPoolId === ETH_PID;

  // 获取池子数据
  const ethData = getPoolUserData(ETH_PID);
  const erc20Data = getPoolUserData(ERC20_PID);
  const currentPoolData = getPoolUserData(selectedPoolId);

  // 获取统计数据
  const poolStats = getPoolStatsSummary();

  // 格式化余额显示
  const formatBalance = (value: bigint | string | undefined, decimals = 18) => {
    if (!value) return "0.0000";
    const stringValue =
      typeof value === "string" ? value : formatUnits(value, decimals);
    const num = parseFloat(stringValue);
    return num.toFixed(4);
  };

  // 检查是否可以提现
  const isWithdrawable = useMemo(() => {
    if (!currentPoolData || !isConnected) return false;
    return currentPoolData.withdrawable > BigInt(0);
  }, [currentPoolData, isConnected]);

  // 获取时间剩余（模拟）
  const getTimeRemaining = () => {
    return "15:30"; // 示例时间，实际应该从合约计算
  };

  // 处理解除质押
  const handleUnstake = async () => {
    if (!address || !unstakeAmount || parseFloat(unstakeAmount) <= 0) return;

    try {
      setUnstakeLoading(true);

      const amountBigInt = parseUnits(unstakeAmount, 18);
      const result = await unstakeFromPool(selectedPoolId, amountBigInt);

      if (result.success) {
        toast.success("Unstake request submitted successfully!");
        setUnstakeAmount("0");
        // 等待交易确认
        if (result.txHash) {
          const res = await publicClient.waitForTransactionReceipt({
            hash: result.txHash as `0x${string}`,
          });
          if (res.status === "success") {
            toast.success("Transaction confirmed!");
            refreshData();
          }
        }
      } else {
        toast.error(result.error || "Unstake failed");
      }
    } catch (error) {
      console.error("Unstake error:", error);
      toast.error("Transaction failed");
    } finally {
      setUnstakeLoading(false);
    }
  };

  // 处理提现
  const handleWithdraw = async () => {
    if (!address) return;

    try {
      setWithdrawLoading(true);

      const result = await withdrawFromPool(selectedPoolId);

      if (result.success) {
        toast.success("Withdrawal initiated successfully!");
        // 等待交易确认
        if (result.txHash) {
          const res = await publicClient.waitForTransactionReceipt({
            hash: result.txHash as `0x${string}`,
          });
          if (res.status === "success") {
            toast.success("Withdrawal completed!");
            refreshData();
          }
        }
      } else {
        toast.error(result.error || "Withdrawal failed");
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      toast.error("Transaction failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // 设置数量百分比
  const setAmountPercentage = (percentage: string) => {
    if (!currentPoolData) return;

    const stakedAmount = parseFloat(formatUnits(currentPoolData.staked, 18));
    let targetAmount = 0;

    switch (percentage) {
      case "25%":
        targetAmount = stakedAmount * 0.25;
        break;
      case "50%":
        targetAmount = stakedAmount * 0.5;
        break;
      case "75%":
        targetAmount = stakedAmount * 0.75;
        break;
      case "MAX":
        targetAmount = stakedAmount;
        break;
    }
    setUnstakeAmount(targetAmount.toFixed(6));
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading withdraw data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* 标题区域 */}
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-6xl font-bold mb-4 text-glow-purple">
          Withdraw <span className="text-glow-cyan">Portal</span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          💸 Manage your staked assets across multiple pools
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
        {/* 池子选择器 */}
        <div className="card-cyber">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">
              Select Pool
            </h2>
            <p className="text-gray-400">Choose which pool to manage</p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setSelectedPoolId(ETH_PID)}
              className={`pool-selector ${
                selectedPoolId === ETH_PID
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                  : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-cyan-400/50"
              }`}
            >
              <div className="text-2xl mb-2">{POOL_CONFIGS[ETH_PID].icon}</div>
              <div className="font-bold">{POOL_CONFIGS[ETH_PID].name}</div>
              <div className="text-sm opacity-80">
                {POOL_CONFIGS[ETH_PID].symbol}
              </div>
            </button>

            <button
              onClick={() => setSelectedPoolId(ERC20_PID)}
              className={`pool-selector ${
                selectedPoolId === ERC20_PID
                  ? "bg-purple-500/20 border-purple-400 text-purple-300"
                  : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-purple-400/50"
              }`}
            >
              <div className="text-2xl mb-2">
                {POOL_CONFIGS[ERC20_PID].icon}
              </div>
              <div className="font-bold">{POOL_CONFIGS[ERC20_PID].name}</div>
              <div className="text-sm opacity-80">
                {POOL_CONFIGS[ERC20_PID].symbol}
              </div>
            </button>
          </div>
        </div>

        {/* Portfolio Overview - 显示两个池子的统计 */}
        <div className="card-cyber">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">
              📊 Portfolio Overview
            </h2>
            <p className="text-gray-400">
              Your complete staking position across all pools
            </p>
          </div>

          {/* ETH Pool Stats */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
              {POOL_CONFIGS[ETH_PID].icon} ETH Pool
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="data-display border-cyan-400/30 text-center">
                <div className="text-2xl mb-2">🔒</div>
                <div className="text-sm text-gray-400 mb-2">Total Staked</div>
                <div className="text-xl font-bold text-cyan-400">
                  {formatBalance(poolStats.eth.staked)} ETH
                </div>
              </div>
              <div className="data-display text-center">
                <div className="text-2xl mb-2">⏳</div>
                <div className="text-sm text-gray-400 mb-2">
                  Pending Withdrawal
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {formatBalance(poolStats.eth.withdrawStats.withdrawPending)}{" "}
                  ETH
                </div>
              </div>
              <div className="data-display text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm text-gray-400 mb-2">
                  Ready to Withdraw
                </div>
                <div className="text-xl font-bold text-green-400">
                  {formatBalance(poolStats.eth.withdrawStats.withdrawable)} ETH
                </div>
              </div>
            </div>
          </div>

          {/* ERC20 Pool Stats */}
          <div>
            <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
              {POOL_CONFIGS[ERC20_PID].icon} MetaNode Token Pool
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="data-display border-purple-400/30 text-center">
                <div className="text-2xl mb-2">🔒</div>
                <div className="text-sm text-gray-400 mb-2">Total Staked</div>
                <div className="text-xl font-bold text-purple-400">
                  {formatBalance(poolStats.erc20.staked)} MTN
                </div>
              </div>
              <div className="data-display text-center">
                <div className="text-2xl mb-2">⏳</div>
                <div className="text-sm text-gray-400 mb-2">
                  Pending Withdrawal
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {formatBalance(poolStats.erc20.withdrawStats.withdrawPending)}{" "}
                  MTN
                </div>
              </div>
              <div className="data-display text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm text-gray-400 mb-2">
                  Ready to Withdraw
                </div>
                <div className="text-xl font-bold text-green-400">
                  {formatBalance(poolStats.erc20.withdrawStats.withdrawable)}{" "}
                  MTN
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 当前选中池子的操作区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 解除质押卡片 */}
          <div className="card-cyber">
            <div className="text-center mb-6">
              <h3
                className={`text-2xl font-bold mb-2 ${
                  isCurrentPoolETH ? "text-cyan-400" : "text-purple-400"
                }`}
              >
                🔓 Unstake {currentPoolConfig.symbol}
              </h3>
              <p className="text-gray-400">
                Initiate withdrawal process for {currentPoolConfig.name}
              </p>
            </div>

            <div className="space-y-6">
              {/* 当前质押显示 */}
              <div className="data-display text-center">
                <div className="text-sm text-gray-400 mb-2">
                  Available to Unstake
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isCurrentPoolETH ? "text-cyan-400" : "text-purple-400"
                  }`}
                >
                  {formatBalance(currentPoolData?.staked)}{" "}
                  {currentPoolConfig.symbol}
                </div>
              </div>

              {/* 输入区域 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount to Unstake
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    max={formatUnits(currentPoolData?.staked || BigInt(0), 18)}
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="input-cyber pr-20"
                    placeholder="0.0000"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span
                      className={`font-bold ${
                        isCurrentPoolETH ? "text-cyan-400" : "text-purple-400"
                      }`}
                    >
                      {currentPoolConfig.symbol}
                    </span>
                  </div>
                </div>

                {/* 快速选择按钮 */}
                <div className="flex gap-2 mt-3">
                  {["25%", "50%", "75%", "MAX"].map((percentage) => (
                    <button
                      key={percentage}
                      onClick={() => setAmountPercentage(percentage)}
                      className={`text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 
                               border border-gray-500/30 rounded transition-all duration-200
                               hover:shadow-sm ${
                                 isCurrentPoolETH
                                   ? "text-cyan-400 hover:border-cyan-400 hover:shadow-cyan-400/30"
                                   : "text-purple-400 hover:border-purple-400 hover:shadow-purple-400/30"
                               }`}
                    >
                      {percentage}
                    </button>
                  ))}
                </div>
              </div>

              {/* 解除质押按钮 */}
              <div className="space-y-4">
                {!isConnected ? (
                  <div className="flex justify-center">
                    <ConnectButton />
                  </div>
                ) : (
                  <button
                    className={`w-full btn-cyber-secondary ${
                      unstakeLoading ? "loading-pulse" : ""
                    }`}
                    onClick={handleUnstake}
                    disabled={
                      unstakeLoading ||
                      !unstakeAmount ||
                      parseFloat(unstakeAmount) <= 0
                    }
                  >
                    {unstakeLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>🔓</span>
                        Unstake {currentPoolConfig.symbol}
                      </div>
                    )}
                  </button>
                )}

                {/* 提示信息 */}
                <div className="data-display text-center">
                  <div className="text-xs text-gray-400">
                    ⚠️ Unstaking initiates a cooldown period before withdrawal
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 提取资金卡片 */}
          <div className="card-cyber">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-green-400 mb-2">
                💸 Withdraw {currentPoolConfig.symbol}
              </h3>
              <p className="text-gray-400">
                Claim your available funds from {currentPoolConfig.name}
              </p>
            </div>

            <div className="space-y-6">
              {/* 可提取金额显示 */}
              <div className="data-display text-center p-6 border-2 border-green-400/30">
                <div className="text-lg text-gray-400 mb-2">
                  Available to Withdraw
                </div>
                <div className="text-4xl font-bold text-green-400 text-glow mb-4">
                  {formatBalance(currentPoolData?.withdrawable)}{" "}
                  {currentPoolConfig.symbol}
                </div>
                <div className="text-sm text-gray-500">
                  {isWithdrawable
                    ? "🕐 Cooldown completed"
                    : "⏳ Waiting for cooldown"}
                </div>
              </div>

              {/* 等待提现显示 */}
              {currentPoolData &&
                currentPoolData.withdrawPending > BigInt(0) && (
                  <div className="data-display text-center p-4 border-2 border-yellow-400/30">
                    <div className="text-sm text-gray-400 mb-2">
                      Pending Withdrawal
                    </div>
                    <div className="text-2xl font-bold text-yellow-400 mb-2">
                      {formatBalance(currentPoolData.withdrawPending)}{" "}
                      {currentPoolConfig.symbol}
                    </div>
                    <div className="text-xs text-gray-500">
                      ⏰ {getTimeRemaining()} remaining
                    </div>
                  </div>
                )}

              {/* 提取按钮 */}
              <button
                className={`w-full btn-cyber ${
                  withdrawLoading ? "loading-pulse" : ""
                } ${!isWithdrawable ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleWithdraw}
                disabled={!isWithdrawable || withdrawLoading}
              >
                {withdrawLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>💸</span>
                    {isWithdrawable ? "Withdraw Now" : "No Funds Available"}
                  </div>
                )}
              </button>

              {/* 状态指示 */}
              {!isWithdrawable && isConnected && (
                <div className="data-display text-center">
                  <div className="text-sm text-yellow-400">
                    {currentPoolData &&
                    currentPoolData.withdrawPending > BigInt(0)
                      ? "⏳ Funds are in cooldown period"
                      : `💡 Unstake some ${currentPoolConfig.symbol} to withdraw`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 流程说明 */}
        <div className="card-cyber">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-cyan-400">
              🔄 Withdrawal Process
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl mb-3">1️⃣</div>
              <h4 className="text-lg font-bold text-purple-400 mb-2">
                Unstake
              </h4>
              <p className="text-sm text-gray-400">
                Request to unstake your tokens from the selected pool
              </p>
            </div>

            <div className="text-center p-4">
              <div className="text-3xl mb-3">2️⃣</div>
              <h4 className="text-lg font-bold text-yellow-400 mb-2">Wait</h4>
              <p className="text-sm text-gray-400">
                Cooldown period as defined by the pool (typically 20 blocks)
              </p>
            </div>

            <div className="text-center p-4">
              <div className="text-3xl mb-3">3️⃣</div>
              <h4 className="text-lg font-bold text-green-400 mb-2">
                Withdraw
              </h4>
              <p className="text-sm text-gray-400">
                Claim your tokens back to your wallet
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;
