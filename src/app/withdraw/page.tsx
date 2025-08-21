"use client";
import { useStakeContract } from "@/hooks/useStakeContract";
import { useAccount } from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { Pid } from "@/utils";
import { viemClients } from "@/utils/viem";
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

  const { publicClient } = viemClients(chainId as number);

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

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-3xl font-bold">Withdraw</h1>
      <p className="text-gray-600">Unstake and withdraw your ETH</p>
      <div className="border border-gray-200 rounded-xl p-5 w-[600px] mt-8">
        <div className="grid grid-cols-3 gap-8 mb-16">
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-600 mb-2">Staked Amount: </div>
            <div className="text-lg font-bold">{userData.staked} ETH</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-600 mb-2">
              Available to withdraw:{" "}
            </div>
            <div className="text-lg font-bold">{userData.withdrawable} ETH</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-600 mb-2">Withdraw Pending: </div>
            <div className="text-lg font-bold">
              {userData.withdrawPending} ETH
            </div>
          </div>
        </div>
      </div>

      <div className="text-xl mb-3">Unstake</div>
      <input
        type="text"
        onChange={(e) => {
          setAmount(e.target.value);
        }}
        className="min-w-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
        focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Amount"
      />
      <div className="mt-5">
        {!isConnected ? (
          <ConnectButton />
        ) : (
          <button
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2
               focus:ring-blue-500 focus:ring-offset-2 ${
                 unstakeLoading ? "opacity-50 cursor-not-allowed" : ""
               }`}
            disabled={unstakeLoading}
            onClick={handleUnStake}
          >
            {unstakeLoading ? "Unstaking..." : "Unstake"}
          </button>
        )}
      </div>

      <div className="text-xl mb-3 mt-10">Withdraw</div>
      <div className="mb-2">
        Ready Amount: {userData.withdrawable}{" "}
        <span className="text-gray-500">20 min cooldown</span>
      </div>
      <p className="text-sm text-gray-600 mb-5">
        After unstaking, you need to wait 20 minutes to withdraw.
      </p>
      <button
        className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none
          focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
        ${!isWithdrawable ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={!isWithdrawable || withdrawLoading}
        onClick={handleWithdraw}
      >
        {withdrawLoading ? "Withdrawing..." : "Withdraw"}
      </button>
    </div>
  );
};

export default WithdrawPage;
