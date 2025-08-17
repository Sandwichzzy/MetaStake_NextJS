"use client";

import { useStakeContract } from "@/hooks/useContract";
import { useEffect, useState } from "react";
import { useAccount, useBalance, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits, parseUnits } from "viem";
import { toast } from "react-toastify";
import { viemClients } from "@/utils/viem";

const HomePage = () => {
  const stakeContract = useStakeContract();
  const { address, isConnected, chainId } = useAccount();
  const [loading, setLoading] = useState(false);
  const [stakedAmount, setStakedAmount] = useState("0");
  const [amount, setAmount] = useState("0");
  const { data: balance } = useBalance({
    address: address,
  });

  const getStakedAmount = async () => {
    if (address && stakeContract) {
      const res = await stakeContract.read.stakingBalance([0, address]); //pid=0
      setStakedAmount(formatUnits(res as bigint, 18));
    }
  };

  useEffect(() => {
    if (stakeContract && address) {
      getStakedAmount();
    }
  }, [stakeContract, address]);

  const handleStake = async () => {
    if (!stakeContract || !address) return;
    if (parseFloat(amount) > parseFloat(balance!.formatted)) {
      toast.error("Insufficient balance");
      return;
    }
    try {
      setLoading(true);
      const { publicClient, walletClient } = viemClients(chainId as number); //只支持配置的链

      const tx = await stakeContract?.write.depositETH([], {
        value: parseUnits(amount, 18),
        account: address,
      });
      const res = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });
      if (res.status === "success") {
        toast.success("Transaction successful");
        console.log(res, "tx");
        setLoading(false);
        getStakedAmount();
      } else {
        toast.error("Transaction failed");
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.log(error, "stake-error");
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-screen justify-center">
      <h1 className="text-3xl font-bold">MetaNode Stake</h1>
      <p className="text-gray-600">Stake ETH to earn tokens.</p>
      <div className="border border-gray-200 rounded-xl p-5 w-[600px] mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span>Staked Amount: </span>
          <span className="font-medium">{stakedAmount} ETH</span>
        </div>
        <input
          type="text"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setAmount(e.target.value);
          }}
          className="min-w-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Amount"
        />
        <div className="mt-8">
          {!isConnected ? (
            <ConnectButton />
          ) : (
            <button
              className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleStake}
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
