import { useCallback, useMemo, useState, useEffect } from "react";
import { type Address } from "viem";
import { getContract } from "../utils/contractHelper";
import { erc20Abi } from "../abis/erc20";
import { sepolia } from "viem/chains";

// ERC20合约Hook
export const useERC20Contract = (tokenAddress: Address) => {
  // 合约实例状态
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化合约实例
  useEffect(() => {
    const initContract = async () => {
      if (
        !tokenAddress ||
        tokenAddress === "0x0000000000000000000000000000000000000000"
      ) {
        console.log(
          "ERC20Contract: Invalid or missing token address:",
          tokenAddress
        );
        setError("Invalid token address");
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
          abi: erc20Abi,
          address: tokenAddress,
          chainId: sepolia.id,
        });
        setContract(contractInstance);
        console.log("ERC20Contract: Successfully initialized");
      } catch (err) {
        console.error("ERC20 Contract initialization error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize ERC20 contract"
        );
      } finally {
        setLoading(false);
      }
    };

    initContract();
  }, [tokenAddress]);

  // 读取合约数据的通用函数
  const readContractData = useCallback(
    async (functionName: string, args: any[] = []) => {
      if (!contract) {
        console.error(
          "ERC20Contract: Contract not initialized when calling",
          functionName
        );
        throw new Error("ERC20 Contract not initialized");
      }

      try {
        return await contract.read[functionName](args);
      } catch (error) {
        console.error(`Error reading ERC20 ${functionName}:`, error);
        throw error;
      }
    },
    [contract]
  );

  // 写入合约数据的通用函数
  const writeContractData = useCallback(
    async (functionName: string, args: any[] = [], account: `0x${string}`) => {
      if (!contract) {
        throw new Error("ERC20 Contract not initialized");
      }

      try {
        return await contract.writeContract({
          functionName,
          args,
          account,
        });
      } catch (error) {
        console.error(`Error writing ERC20 ${functionName}:`, error);
        throw error;
      }
    },
    [contract]
  );

  // 具体的ERC20合约函数

  // 读取操作
  const getTokenName = useCallback(async () => {
    return await readContractData("name");
  }, [readContractData]);

  const getTokenSymbol = useCallback(async () => {
    return await readContractData("symbol");
  }, [readContractData]);

  const getTokenDecimals = useCallback(async () => {
    return await readContractData("decimals");
  }, [readContractData]);

  const getTotalSupply = useCallback(async () => {
    return await readContractData("totalSupply");
  }, [readContractData]);

  const getBalance = useCallback(
    async (account: Address) => {
      return await readContractData("balanceOf", [account]);
    },
    [readContractData]
  );

  const getAllowance = useCallback(
    async (owner: Address, spender: Address) => {
      return await readContractData("allowance", [owner, spender]);
    },
    [readContractData]
  );

  // 写入操作
  const approve = useCallback(
    async (spender: Address, amount: bigint, account: `0x${string}`) => {
      return await writeContractData("approve", [spender, amount], account);
    },
    [writeContractData]
  );

  const transfer = useCallback(
    async (to: Address, amount: bigint, account: `0x${string}`) => {
      return await writeContractData("transfer", [to, amount], account);
    },
    [writeContractData]
  );

  // 批量读取操作
  const getTokenInfo = useCallback(async () => {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        getTokenName(),
        getTokenSymbol(),
        getTokenDecimals(),
        getTotalSupply(),
      ]);

      return {
        name,
        symbol,
        decimals,
        totalSupply,
        address: tokenAddress,
      };
    } catch (error) {
      console.error("Error getting token info:", error);
      throw error;
    }
  }, [
    getTokenName,
    getTokenSymbol,
    getTokenDecimals,
    getTotalSupply,
    tokenAddress,
  ]);

  // 获取用户代币信息
  const getUserTokenInfo = useCallback(
    async (userAddress: Address, spenderAddress?: Address) => {
      try {
        const balance = await getBalance(userAddress);
        let allowance = BigInt(0);

        if (spenderAddress) {
          allowance = await getAllowance(userAddress, spenderAddress);
        }

        return {
          balance,
          allowance,
          address: tokenAddress,
        };
      } catch (error) {
        console.error("Error getting user token info:", error);
        throw error;
      }
    },
    [getBalance, getAllowance, tokenAddress]
  );

  return {
    // 合约实例和状态
    contract,
    loading,
    error,
    tokenAddress,

    // 读取操作
    getTokenName,
    getTokenSymbol,
    getTokenDecimals,
    getTotalSupply,
    getBalance,
    getAllowance,

    // 写入操作
    approve,
    transfer,

    // 批量操作
    getTokenInfo,
    getUserTokenInfo,
  };
};
