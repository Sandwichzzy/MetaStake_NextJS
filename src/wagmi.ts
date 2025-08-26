import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { mainnet, sepolia } from "viem/chains";
import { injected, walletConnect } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia],
    connectors: [
      injected(),
      walletConnect({
        projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true, // 启用SSR支持，但通过组件级别的客户端检测来处理
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
