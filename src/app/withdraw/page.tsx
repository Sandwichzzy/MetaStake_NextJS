"use client";
import { useStakeContract } from "@/hooks/useStakeContract";
import { useAccount } from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { Pid } from "@/utils";
import { viemClients, defaultChainId } from "@/utils/viem";
import { toast } from "react-toastify";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export type UserStakeData = {
  staked: string;
  withdrawPending: string;
  withdrawable: string;
};

const InitData = {
  staked: "0",
  withdrawPending: "0",
  withdrawable: "0",
};

const WithdrawPage = () => {
  const { contract, getStakingBalance, requestUnstake, withdraw } =
    useStakeContract();

  const { address, isConnected, chainId } = useAccount();
  const [amount, setAmount] = useState("0");
  const [unstakeLoading, setUnstakeLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [userData, setUserData] = useState<UserStakeData>(InitData);

  const { publicClient } = viemClients(chainId || defaultChainId);

  const isWithdrawable = useMemo(() => {
    return Number(userData.withdrawable) > 0 && isConnected;
  }, [userData, isConnected]);

  const getUserData = async () => {
    if (!contract || !address) return;

    try {
      // 使用封装的方法获取质押余额
      const staked = await getStakingBalance(Pid, address);

      // 使用合约实例直接读取提现信息
      const [requestAmount, pendingWithdrawAmount] =
        (await contract.read.withdrawAmount([Pid, address])) as [
          bigint,
          bigint
        ];

      const available = Number(formatUnits(pendingWithdrawAmount, 18));
      const req = Number(formatUnits(requestAmount, 18));
      console.log(req, available);

      setUserData({
        staked: formatUnits(staked as bigint, 18),
        withdrawPending: (req - available).toString(),
        withdrawable: available.toString(),
      });
    } catch (error) {
      console.error("Error getting user data:", error);
      toast.error("Failed to get user data");
    }
  };

  useEffect(() => {
    if (contract && address) {
      getUserData();
    }
  }, [contract, address]);

  const handleUnStake = async () => {
    if (!contract || !address) return;

    try {
      setUnstakeLoading(true);

      // 使用封装的requestUnstake方法
      const tx = await requestUnstake(Pid, parseUnits(amount, 18), address);

      const res = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      if (res.status === "success") {
        toast.success("Transaction successful");
        getUserData(); // 重新获取用户数据
      } else {
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error(error, "unstake-error");
      toast.error("Transaction failed");
    } finally {
      setUnstakeLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !address) return;

    try {
      setWithdrawLoading(true);

      // 使用封装的withdraw方法
      const tx = await withdraw(Pid, address);

      const res = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      if (res.status === "success") {
        toast.success("Transaction successful");
        getUserData(); // 重新获取用户数据
      } else {
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error(error, "withdraw-error");
      toast.error("Transaction failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatBalance = (value: string) => {
    const num = parseFloat(value);
    return num.toFixed(4);
  };

  const getTimeRemaining = () => {
    // 这里可以根据实际合约逻辑计算剩余时间
    return "20:00"; // 示例时间
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* 标题区域 */}
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-6xl font-bold mb-4 text-glow-purple">
          Withdraw <span className="text-glow-cyan">Portal</span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          💸 Manage your staked assets
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
        {/* 账户状态卡片 */}
        <div className="card-cyber">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">
              📊 Portfolio Overview
            </h2>
            <p className="text-gray-400">Your staking position summary</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 已质押金额 */}
            <div className="data-display border-glow-animation text-center">
              <div className="text-3xl mb-2">🔒</div>
              <div className="text-sm text-gray-400 mb-2">Total Staked</div>
              <div className="text-2xl font-bold text-cyan-400 text-glow">
                {formatBalance(userData.staked)} ETH
              </div>
            </div>

            {/* 待提取金额 */}
            <div className="data-display text-center">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-sm text-gray-400 mb-2">
                Pending Withdrawal
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {formatBalance(userData.withdrawPending)} ETH
              </div>
              {parseFloat(userData.withdrawPending) > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  ⏰ {getTimeRemaining()} remaining
                </div>
              )}
            </div>

            {/* 可提取金额 */}
            <div className="data-display text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-sm text-gray-400 mb-2">
                Ready to Withdraw
              </div>
              <div className="text-2xl font-bold text-green-400">
                {formatBalance(userData.withdrawable)} ETH
              </div>
            </div>
          </div>
        </div>

        {/* 操作区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 解除质押卡片 */}
          <div className="card-cyber">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-purple-400 mb-2">
                🔓 Unstake ETH
              </h3>
              <p className="text-gray-400">Initiate withdrawal process</p>
            </div>

            <div className="space-y-6">
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
                    max={userData.staked}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-cyber pr-16"
                    placeholder="0.0000"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-purple-400 font-bold">ETH</span>
                  </div>
                </div>

                {/* 快速选择按钮 */}
                <div className="flex gap-2 mt-3">
                  {["25%", "50%", "75%", "MAX"].map((percentage) => (
                    <button
                      key={percentage}
                      onClick={() => {
                        const stakedNum = parseFloat(userData.staked);
                        let targetAmount = 0;
                        switch (percentage) {
                          case "25%":
                            targetAmount = stakedNum * 0.25;
                            break;
                          case "50%":
                            targetAmount = stakedNum * 0.5;
                            break;
                          case "75%":
                            targetAmount = stakedNum * 0.75;
                            break;
                          case "MAX":
                            targetAmount = stakedNum;
                            break;
                        }
                        setAmount(targetAmount.toFixed(6));
                      }}
                      className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-purple-400 
                               border border-purple-400/30 rounded transition-all duration-200
                               hover:border-purple-400 hover:shadow-sm hover:shadow-purple-400/30"
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
                    onClick={handleUnStake}
                    disabled={
                      unstakeLoading || !amount || parseFloat(amount) <= 0
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
                        Unstake ETH
                      </div>
                    )}
                  </button>
                )}

                {/* 提示信息 */}
                <div className="data-display text-center">
                  <div className="text-xs text-gray-400">
                    ⚠️ Unstaking initiates a 5~10 minute cooldown period
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 提取资金卡片 */}
          <div className="card-cyber">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-green-400 mb-2">
                💸 Withdraw ETH
              </h3>
              <p className="text-gray-400">Claim your available funds</p>
            </div>

            <div className="space-y-6">
              {/* 可提取金额显示 */}
              <div className="data-display text-center p-6 border-2 border-green-400/30">
                <div className="text-lg text-gray-400 mb-2">
                  Available to Withdraw
                </div>
                <div className="text-4xl font-bold text-green-400 text-glow mb-4">
                  {formatBalance(userData.withdrawable)} ETH
                </div>
                <div className="text-sm text-gray-500">
                  🕐 Cooldown completed
                </div>
              </div>

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
                    {parseFloat(userData.withdrawPending) > 0
                      ? "⏳ Funds are in cooldown period"
                      : "💡 Unstake some ETH to withdraw"}
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
                Request to unstake your ETH
              </p>
            </div>

            <div className="text-center p-4">
              <div className="text-3xl mb-3">2️⃣</div>
              <h4 className="text-lg font-bold text-yellow-400 mb-2">Wait</h4>
              <p className="text-sm text-gray-400">
                5-10 minute cooldown period
              </p>
            </div>

            <div className="text-center p-4">
              <div className="text-3xl mb-3">3️⃣</div>
              <h4 className="text-lg font-bold text-green-400 mb-2">
                Withdraw
              </h4>
              <p className="text-sm text-gray-400">Claim your ETH back</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;
