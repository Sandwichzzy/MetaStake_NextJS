"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

export default function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: "/", label: "Stake", icon: "🔥" },
    { href: "/withdraw", label: "Withdraw", icon: "⚡" },
    { href: "/rewards", label: "Rewards", icon: "🏆" },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  if (!mounted) return null;

  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-gray-900/80 border-b border-cyan-400/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo区域 */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div
                  className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg 
                               flex items-center justify-center transform group-hover:scale-110 
                               transition-transform duration-300"
                >
                  <span className="text-xl font-bold">M</span>
                </div>
                <div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 
                               rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"
                ></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-glow-cyan">
                  Meta<span className="text-glow-purple">Stake</span>
                </h1>
                <p className="text-xs text-gray-400">DeFi Protocol</p>
              </div>
            </Link>
          </div>

          {/* 导航菜单 */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative group px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive(item.href)
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/50"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>

                {/* 发光效果 */}
                {isActive(item.href) && (
                  <div className="absolute inset-0 bg-cyan-400/10 rounded-lg blur-sm"></div>
                )}

                {/* 悬停动画线条 */}
                <div
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 
                               transition-all duration-300 ${
                                 isActive(item.href)
                                   ? "w-full"
                                   : "w-0 group-hover:w-full"
                               }`}
                ></div>
              </Link>
            ))}
          </nav>

          {/* 连接钱包区域 */}
          <div className="flex items-center space-x-4">
            {/* 网络状态指示器 */}
            <div className="hidden sm:flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? "bg-green-400 shadow-green-400/50"
                    : "bg-red-400 shadow-red-400/50"
                } shadow-lg animate-pulse`}
              ></div>
              <span className="text-xs text-gray-400">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {/* 连接钱包按钮 */}
            <div className="transform hover:scale-105 transition-transform duration-200">
              <ConnectButton />
            </div>
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <button className="text-gray-300 hover:text-white p-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        <div className="md:hidden border-t border-gray-700/50 py-4">
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive(item.href)
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/50"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 装饰性光效 */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
    </header>
  );
}
