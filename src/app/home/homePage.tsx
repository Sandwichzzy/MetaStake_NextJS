"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits, parseUnits } from "viem";
import { toast } from "react-toastify";
import { useMultiPoolStaking } from "@/hooks/useMultiPoolStaking";
import {
  ETH_PID,
  ERC20_PID,
  PoolId,
  getPoolConfig,
  isETHPool,
  isERC20Pool,
  POOL_CONFIGS,
} from "@/utils";

const HomePage = () => {
  const {
    multiPoolData,
    getPoolUserData,
    getETHStaked,
    getERC20Staked,
    getETHPendingRewards,
    getERC20PendingRewards,
    stakeToPool,
    approveERC20,
    checkERC20Allowance,
    loading: multiPoolLoading,
    isConnected,
    userAddress: address,
  } = useMultiPoolStaking();

  // 当前选中的池子
  const [selectedPoolId, setSelectedPoolId] = useState<PoolId>(ETH_PID);
  const [amount, setAmount] = useState("0");
  const [stakeLoading, setStakeLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  // 获取当前池子配置
  const currentPoolConfig = getPoolConfig(selectedPoolId);
  const isCurrentPoolETH = isETHPool(selectedPoolId);

  // 获取ETH余额
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // 获取当前池子的用户数据
  const currentPoolUserData = getPoolUserData(selectedPoolId);
  const ethUserData = getPoolUserData(ETH_PID);
  const erc20UserData = getPoolUserData(ERC20_PID);

  // 获取代币余额
  const tokenBalance = multiPoolData.tokenInfo?.balance || BigInt(0);

  // 获取当前余额（ETH或ERC20）
  const getCurrentBalance = () => {
    if (isCurrentPoolETH) {
      return ethBalance?.value || BigInt(0);
    } else {
      return tokenBalance;
    }
  };

  // 获取当前已质押金额
  const getCurrentStaked = () => {
    if (isCurrentPoolETH) {
      return getETHStaked();
    } else {
      return getERC20Staked();
    }
  };

  // 获取当前待领取奖励
  const getCurrentPendingRewards = () => {
    if (isCurrentPoolETH) {
      return getETHPendingRewards();
    } else {
      return getERC20PendingRewards();
    }
  };

  // 处理质押
  const handleStake = async () => {
    if (!address) return;

    const amountBigInt = parseUnits(amount, 18);
    const currentBalance = getCurrentBalance();

    // 检查余额
    if (amountBigInt > currentBalance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      setStakeLoading(true);

      // 执行质押
      const result = await stakeToPool(selectedPoolId, amountBigInt);

      if (result.success) {
        toast.success("Transaction submitted successfully!");
        setAmount("0");
      } else if (result.needsApproval) {
        toast.info("Token approval required. Please approve first.");
      } else {
        toast.error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error("Stake error:", error);
      toast.error("Transaction failed");
    } finally {
      setStakeLoading(false);
    }
  };

  // 处理授权
  const handleApprove = async () => {
    if (!address || isCurrentPoolETH) return;

    const amountBigInt = parseUnits(amount, 18);

    try {
      setApproveLoading(true);

      const result = await approveERC20(amountBigInt);

      if (result.success) {
        toast.success("Approval successful!");
      } else {
        toast.error(result.error || "Approval failed");
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Approval failed");
    } finally {
      setApproveLoading(false);
    }
  };

  // 检查是否需要授权
  const needsApproval = async () => {
    if (isCurrentPoolETH || !amount || parseFloat(amount) <= 0) {
      return false;
    }

    const amountBigInt = parseUnits(amount, 18);
    const hasAllowance = await checkERC20Allowance(amountBigInt);
    return !hasAllowance;
  };

  const [needsApprovalState, setNeedsApprovalState] = useState(false);

  // 监听金额变化，检查授权状态
  useEffect(() => {
    const checkApproval = async () => {
      const needs = await needsApproval();
      setNeedsApprovalState(needs);
    };

    if (!isCurrentPoolETH && amount && parseFloat(amount) > 0) {
      checkApproval();
    } else {
      setNeedsApprovalState(false);
    }
  }, [amount, selectedPoolId]);

  const formatBalance = (value: bigint | string | undefined, decimals = 18) => {
    if (!value) return "0.00";

    if (typeof value === "string") {
      const num = parseFloat(value);
      return num.toFixed(4);
    }

    const formatted = formatUnits(value, decimals);
    const num = parseFloat(formatted);
    return num.toFixed(4);
  };

  // 设置金额百分比
  const setAmountPercentage = (percentage: number) => {
    const currentBalance = getCurrentBalance();
    if (currentBalance > 0) {
      const balanceFormatted = formatUnits(currentBalance, 18);
      const balanceNum = parseFloat(balanceFormatted);
      let targetAmount = 0;

      switch (percentage) {
        case 25:
          targetAmount = balanceNum * 0.25;
          break;
        case 50:
          targetAmount = balanceNum * 0.5;
          break;
        case 75:
          targetAmount = balanceNum * 0.75;
          break;
        case 100:
          targetAmount = isCurrentPoolETH ? balanceNum * 0.99 : balanceNum; // ETH留点gas费
          break;
      }
      setAmount(targetAmount.toFixed(6));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* 标题区域 */}
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-6xl font-bold mb-4 text-glow-cyan">
          Meta<span className="text-glow-purple">Stake</span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          🚀 Enter the Future of Multi-Pool DeFi Staking
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
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 账户概览卡片 */}
        <div className="card-cyber space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">
              📊 Pool Overview
            </h2>
          </div>

          <div className="space-y-4">
            {/* ETH池子数据 */}
            <div className="data-display border-glow-animation">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 flex items-center gap-2">
                  {POOL_CONFIGS[ETH_PID].icon} {POOL_CONFIGS[ETH_PID].name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Wallet Balance</div>
                  <div className="text-lg font-bold text-green-400">
                    {formatBalance(ethBalance?.value)} ETH
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Staked</div>
                  <div className="text-lg font-bold text-cyan-400 text-glow">
                    {formatBalance(getETHStaked())} ETH
                  </div>
                </div>
              </div>
            </div>

            {/* ERC20池子数据 */}
            <div className="data-display">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 flex items-center gap-2">
                  {POOL_CONFIGS[ERC20_PID].icon} {POOL_CONFIGS[ERC20_PID].name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Wallet Balance</div>
                  <div className="text-lg font-bold text-green-400">
                    {formatBalance(tokenBalance)}{" "}
                    {POOL_CONFIGS[ERC20_PID].symbol}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Staked</div>
                  <div className="text-lg font-bold text-purple-400 text-glow">
                    {formatBalance(getERC20Staked())}{" "}
                    {POOL_CONFIGS[ERC20_PID].symbol}
                  </div>
                </div>
              </div>
            </div>

            {/* 收益预估 */}
            <div className="data-display">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">📈 Total Pending Rewards</span>
                <span className="text-xl font-bold text-yellow-400">
                  {formatBalance(
                    getETHPendingRewards() + getERC20PendingRewards()
                  )}{" "}
                  MTN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 质押操作卡片 */}
        <div className="card-cyber">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">
              ⚡ Stake Assets
            </h2>
            <p className="text-gray-400">Choose your pool and stake</p>
          </div>

          <div className="space-y-6">
            {/* 池子选择器 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Pool
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* ETH池子选项 */}
                <button
                  onClick={() => setSelectedPoolId(ETH_PID)}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    selectedPoolId === ETH_PID
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                      : "border-gray-600 bg-gray-700/30 text-gray-300 hover:border-cyan-400/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {POOL_CONFIGS[ETH_PID].icon}
                    </div>
                    <div className="font-bold">
                      {POOL_CONFIGS[ETH_PID].symbol}
                    </div>
                    <div className="text-xs text-gray-400">
                      {POOL_CONFIGS[ETH_PID].name}
                    </div>
                  </div>
                </button>

                {/* ERC20池子选项 */}
                <button
                  onClick={() => setSelectedPoolId(ERC20_PID)}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    selectedPoolId === ERC20_PID
                      ? "border-purple-400 bg-purple-400/10 text-purple-400"
                      : "border-gray-600 bg-gray-700/30 text-gray-300 hover:border-purple-400/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {POOL_CONFIGS[ERC20_PID].icon}
                    </div>
                    <div className="font-bold">
                      {POOL_CONFIGS[ERC20_PID].symbol}
                    </div>
                    <div className="text-xs text-gray-400">
                      {POOL_CONFIGS[ERC20_PID].name}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 输入区域 */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount to Stake
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-cyber pr-20"
                  placeholder="0.0000"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span
                    className={`font-bold ${
                      selectedPoolId === ETH_PID
                        ? "text-cyan-400"
                        : "text-purple-400"
                    }`}
                  >
                    {currentPoolConfig.symbol}
                  </span>
                </div>
              </div>

              {/* 快速选择按钮 */}
              <div className="flex gap-2 mt-3">
                {[25, 50, 75, 100].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => setAmountPercentage(percentage)}
                    className={`text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 border rounded transition-all duration-200 ${
                      selectedPoolId === ETH_PID
                        ? "text-cyan-400 border-cyan-400/30 hover:border-cyan-400"
                        : "text-purple-400 border-purple-400/30 hover:border-purple-400"
                    }`}
                  >
                    {percentage === 100 ? "MAX" : `${percentage}%`}
                  </button>
                ))}
              </div>

              {/* 余额显示 */}
              <div className="text-xs text-gray-400 mt-2">
                Available: {formatBalance(getCurrentBalance())}{" "}
                {currentPoolConfig.symbol}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-4">
              {!isConnected || multiPoolLoading ? (
                <div className="flex justify-center">
                  {!isConnected ? (
                    <div className="transform hover:scale-105 transition-transform duration-300">
                      <ConnectButton />
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <div className="w-8 h-8 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin mx-auto mb-2"></div>
                      Loading contracts...
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 授权按钮（仅ERC20需要） */}
                  {needsApprovalState && !isCurrentPoolETH && (
                    <button
                      className={`w-full btn-cyber-secondary ${
                        approveLoading ? "loading-pulse" : ""
                      }`}
                      onClick={handleApprove}
                      disabled={
                        approveLoading || !amount || parseFloat(amount) <= 0
                      }
                    >
                      {approveLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Approving...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>🔓</span>
                          Approve {currentPoolConfig.symbol}
                        </div>
                      )}
                    </button>
                  )}

                  {/* 质押按钮 */}
                  <button
                    className={`w-full btn-cyber ${
                      stakeLoading ? "loading-pulse" : ""
                    } ${
                      needsApprovalState && !isCurrentPoolETH
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={handleStake}
                    disabled={
                      stakeLoading ||
                      !amount ||
                      parseFloat(amount) <= 0 ||
                      (needsApprovalState && !isCurrentPoolETH)
                    }
                  >
                    {stakeLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>{currentPoolConfig.icon}</span>
                        Stake {currentPoolConfig.symbol}
                      </div>
                    )}
                  </button>
                </div>
              )}

              {/* 预估收益显示 */}
              {/* {amount && parseFloat(amount) > 0 && (
                <div className="data-display text-center">
                  <div className="text-sm text-gray-400 mb-1">
                    Estimated Monthly Rewards
                  </div>
                  <div className="text-lg font-bold text-green-400">
                    {((parseFloat(amount) * 0.125) / 12).toFixed(6)} MTN
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* 特性展示区域 */}
      <div className="w-full max-w-5xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-cyan-400/20">
          <div className="text-3xl mb-3">🔐</div>
          <h3 className="text-lg font-bold text-cyan-400 mb-2">Multi-Pool</h3>
          <p className="text-sm text-gray-400">ETH & ERC20 token staking</p>
        </div>

        <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-purple-400/20">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-lg font-bold text-purple-400 mb-2">Fast</h3>
          <p className="text-sm text-gray-400">Instant staking & rewards</p>
        </div>

        <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-green-400/20">
          <div className="text-3xl mb-3">💎</div>
          <h3 className="text-lg font-bold text-green-400 mb-2">Profitable</h3>
          <p className="text-sm text-gray-400">High yield returns</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
