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
      toast.error("Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-screen justify-center">
      <h1 className="text-3xl font-bold">MetaNode Stake</h1>
      <p className="text-gray-600">Stake ETH to earn tokens.</p>
      <div className="border border-gray-200 rounded-xl p-5 w-[600px] mt-8">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span>Staked Amount: </span>
          <span className="font-medium">{stakedAmount} ETH</span>
        </div>
        <input
          type="text"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setAmount(e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Amount"
        />
        <div className="mt-8">
          {!isConnected ? (
            <ConnectButton />
          ) : (
            <button
              className={`w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleStake}
              disabled={loading}
            >
              {loading ? "Staking..." : "Stake"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
