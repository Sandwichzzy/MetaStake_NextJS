"use client";

import { useStakeContract } from "@/hooks/useStakeContract";
import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits, parseUnits } from "viem";
import { toast } from "react-toastify";
import { Pid } from "@/utils";
import { viemClients } from "@/utils/viem";

const HomePage = () => {
  const { contract, getStakingBalance, depositETH } = useStakeContract();

  const { address, isConnected, chainId } = useAccount();
  const [loading, setLoading] = useState(false);
  const [stakedAmount, setStakedAmount] = useState("0");
  const [amount, setAmount] = useState("0");

  const { data: balance } = useBalance({
    address: address,
  });

  const getStakedAmount = async () => {
    if (address && contract) {
      try {
        const res = await getStakingBalance(Pid, address);
        setStakedAmount(formatUnits(res as bigint, 18));
      } catch (error) {
        console.error("Error getting staked amount:", error);
        toast.error("Failed to get staked amount");
      }
    }
  };

  useEffect(() => {
    if (contract && address) {
      getStakedAmount();
    }
  }, [contract, address]);

  const handleStake = async () => {
    if (!contract || !address) return;

    // 检查余额
    if (parseUnits(amount, 18) > (balance?.value || 0)) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      setLoading(true);

      // 使用封装的depositETH方法
      const tx = await depositETH(parseUnits(amount, 18), address);

      toast.success("Transaction submitted successfully!");
      console.log("Transaction hash:", tx);

      // 等待交易确认
      setTimeout(() => {
        getStakedAmount(); // 重新获取质押金额
      }, 2000);
    } catch (error) {
      console.error("Stake error:", error);
      if (
        error instanceof Error &&
        error.message.includes("Please connect your wallet")
      ) {
        toast.error("Please connect your wallet first");
      } else {
        toast.error("Transaction failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (value: string | undefined) => {
    if (!value) return "0.00";
    const num = parseFloat(value);
    return num.toFixed(4);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* 标题区域 */}
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-6xl font-bold mb-4 text-glow-cyan">
          Meta<span className="text-glow-purple">Stake</span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          🚀 Enter the Future of DeFi Staking
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
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 账户信息卡片 */}
        <div className="card-cyber space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">
              📊 Account Overview
            </h2>
          </div>

          <div className="space-y-4">
            {/* 钱包余额 */}
            <div className="data-display">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">💰 Wallet Balance</span>
                <span className="text-xl font-bold text-green-400">
                  {formatBalance(balance?.formatted)} ETH
                </span>
              </div>
            </div>

            {/* 已质押金额 */}
            <div className="data-display border-glow-animation">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">🔒 Staked Amount</span>
                <span className="text-xl font-bold text-cyan-400 text-glow">
                  {formatBalance(stakedAmount)} ETH
                </span>
              </div>
            </div>

            {/* 收益预估 */}
            <div className="data-display">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">📈 Est. APY</span>
                <span className="text-xl font-bold text-purple-400">12.5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 质押操作卡片 */}
        <div className="card-cyber">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">
              ⚡ Stake ETH
            </h2>
            <p className="text-gray-400">Power up your portfolio</p>
          </div>

          <div className="space-y-6">
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
                  className="input-cyber pr-16"
                  placeholder="0.0000"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-cyan-400 font-bold">ETH</span>
                </div>
              </div>

              {/* 快速选择按钮 */}
              <div className="flex gap-2 mt-3">
                {["25%", "50%", "75%", "MAX"].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => {
                      if (balance?.formatted) {
                        const balanceNum = parseFloat(balance.formatted);
                        let targetAmount = 0;
                        switch (percentage) {
                          case "25%":
                            targetAmount = balanceNum * 0.25;
                            break;
                          case "50%":
                            targetAmount = balanceNum * 0.5;
                            break;
                          case "75%":
                            targetAmount = balanceNum * 0.75;
                            break;
                          case "MAX":
                            targetAmount = balanceNum * 0.99;
                            break; // 留点gas费
                        }
                        setAmount(targetAmount.toFixed(6));
                      }
                    }}
                    className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-cyan-400 
                             border border-cyan-400/30 rounded transition-all duration-200
                             hover:border-cyan-400 hover:shadow-sm hover:shadow-cyan-400/30"
                  >
                    {percentage}
                  </button>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-4">
              {!isConnected ? (
                <div className="flex justify-center">
                  <div className="transform hover:scale-105 transition-transform duration-300">
                    <ConnectButton />
                  </div>
                </div>
              ) : (
                <button
                  className={`w-full btn-cyber ${
                    loading ? "loading-pulse" : ""
                  }`}
                  onClick={handleStake}
                  disabled={loading || !amount || parseFloat(amount) <= 0}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>🚀</span>
                      Stake ETH
                    </div>
                  )}
                </button>
              )}

              {/* 预估收益显示 */}
              {amount && parseFloat(amount) > 0 && (
                <div className="data-display text-center">
                  <div className="text-sm text-gray-400 mb-1">
                    Estimated Monthly Rewards
                  </div>
                  <div className="text-lg font-bold text-green-400">
                    {((parseFloat(amount) * 0.125) / 12).toFixed(6)} ETH
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 特性展示区域 */}
      <div className="w-full max-w-4xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-cyan-400/20">
          <div className="text-3xl mb-3">🔐</div>
          <h3 className="text-lg font-bold text-cyan-400 mb-2">Secure</h3>
          <p className="text-sm text-gray-400">Audited smart contracts</p>
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
