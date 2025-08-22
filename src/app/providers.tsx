"use client";

import { type ReactNode } from "react";
import { type State } from "wagmi";
import { useEffect, useState } from "react";
import { ClientProviders } from "@/components/ClientProviders";

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 在客户端挂载前，显示一个简单的加载状态
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-400">Loading MetaStake...</p>
        </div>
      </div>
    );
  }

  return (
    <ClientProviders initialState={props.initialState}>
      {props.children}
    </ClientProviders>
  );
}
