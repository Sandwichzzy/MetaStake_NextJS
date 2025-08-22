# MetaStake V1 - 质押项目

这是一个基于 Next.js 14 的现代化区块链质押项目，使用 viem 和 wagmi 进行区块链交互。项目采用客户端渲染策略，确保最佳的区块链集成体验。

## 项目架构

### 技术栈

- **前端框架**: Next.js 14 (App Router)
- **区块链交互**: viem + wagmi v2
- **钱包连接**: RainbowKit v2
- **样式**: Tailwind CSS v4
- **状态管理**: TanStack Query v5
- **语言**: TypeScript 5
- **渲染策略**: 客户端渲染 (CSR) + 动态导入

### 项目结构

```
MetaStake_NextJS/
├── src/
│   ├── abis/           # 智能合约ABI定义
│   ├── app/            # Next.js App Router页面
│   ├── components/     # 客户端组件
│   ├── hooks/          # 自定义React Hooks
│   └── utils/          # 工具函数
│       ├── viem.ts     # viem客户端配置
│       └── contractHelper.ts  # 合约操作封装
├── next.config.js      # Next.js配置
├── tailwind.config.js  # Tailwind CSS配置
├── package.json
└── README.md
```

## 核心功能

### 1. 区块链客户端配置 (`src/utils/viem.ts`)

提供完整的区块链客户端配置，支持多链操作：

- **支持的链**: Sepolia 测试网、以太坊主网
- **客户端类型**: 公共客户端（只读）、钱包客户端（读写）
- **配置选项**: 链选择、RPC URL、自动环境检测
- **SSR 兼容**: 自动处理服务端渲染和客户端环境差异

#### 主要功能

- `viemClients()`: 创建公共和钱包客户端
- `createPublicClient()`: 创建只读客户端
- `createWalletClient()`: 创建读写客户端
- `getChainById()`: 根据链 ID 获取链信息
- `isChainSupported()`: 检查链是否支持

#### 使用示例

```typescript
import { viemClients, defaultChainId } from "./utils/viem";

// 使用默认配置（Sepolia测试网）
const { publicClient, walletClient } = viemClients(defaultChainId);

// 自定义链ID
const { publicClient, walletClient } = viemClients(1); // mainnet

// 自动环境检测，支持SSR
const { publicClient, walletClient } = viemClients(chainId);
```

### 2. 合约操作封装 (`src/utils/contractHelper.ts`)

提供完整的智能合约操作封装，支持读写操作：

#### 核心功能

- **合约实例创建**: `getContract()`
- **读取操作**: 通过合约实例的 `read` 属性
- **写入操作**: 通过合约实例的 `write` 属性
- **批量读取**: `batchRead()` - 支持多函数调用
- **合约状态**: `getContractStatus()` - 获取合约整体状态

#### 质押合约专用类 (`StakeContract`)

专门为质押合约设计的类，提供以下功能：

##### 读取操作

- `getPoolLength()`: 获取池子数量
- `getPool(poolId)`: 获取池子信息
- `getUserInfo(poolId, user)`: 获取用户质押信息
- `getPendingReward(poolId, user)`: 获取待领取奖励
- `getStakingBalance(poolId, user)`: 获取用户质押余额
- `getTotalPoolWeight()`: 获取总池子权重
- `getMetaNodeAddress()`: 获取 MetaNode 代币地址
- `getMetaNodePerBlock()`: 获取每个区块的奖励数量
- `isPaused()`: 检查是否暂停
- `isClaimPaused()`: 检查是否暂停领取
- `isWithdrawPaused()`: 检查是否暂停提现

##### 写入操作

- `deposit(poolId, amount, account)`: 质押代币
- `depositETH(account, value)`: 质押 ETH
- `claim(poolId, account)`: 领取奖励
- `requestUnstake(poolId, amount, account)`: 申请提现
- `withdraw(poolId, account)`: 提现
- `updatePool(poolId, account)`: 更新池子

#### 使用示例

```typescript
import { useStakeContract } from "@/hooks/useStakeContract";

// 在React组件中使用
const { contract, getStakingBalance, depositETH } = useStakeContract();

// 读取操作
const balance = await getStakingBalance(poolId, userAddress);

// 写入操作
const txHash = await depositETH(amount, account);
```

## 页面结构

### 主要页面

- **首页** (`/`): 质押 ETH 界面，显示账户概览和质押操作
- **提现页面** (`/withdraw`): 解除质押和提现 ETH
- **响应式设计**: 支持桌面和移动设备
- **现代化 UI**: 使用 Tailwind CSS 构建的赛博朋克风格界面

### 布局结构

- **响应式设计**: 支持桌面和移动设备
- **现代化 UI**: 使用 Tailwind CSS 构建美观界面
- **钱包集成**: 支持多种钱包连接
- **客户端渲染**: 确保区块链功能的最佳兼容性

## 开发指南

### 环境要求

- Node.js 18+
- pnpm 或 npm

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建项目

```bash
pnpm build
```

### 启动生产环境

```bash
pnpm start
```

## 配置说明

### 环境变量

项目使用以下环境变量：

- `NEXT_PUBLIC_STAKE_ADDRESS`: 质押合约地址
- `NEXT_PUBLIC_WC_PROJECT_ID`: WalletConnect 项目 ID (可选)
- `NEXT_PUBLIC_ALCHEMY_API_KEY`: Alchemy API 密钥 (用于 RPC)

### 网络配置

- **Sepolia 测试网**: 默认测试环境 (推荐开发使用)
- **以太坊主网**: 生产环境支持
- **多链支持**: 可扩展支持其他 EVM 兼容链

## 技术特性

### 性能优化

- **客户端渲染**: 避免 SSR 相关的区块链 API 问题
- **动态导入**: 减少首次加载的 JavaScript 包体
- **代码分割**: 按需加载组件和功能
- **构建优化**: 生产环境自动移除 console 和调试代码

## 更新日志

### v1.0.0 (最新)

- ✨ 初始版本发布
- 🚀 支持 ETH 质押和提现
- 🔧 客户端渲染优化，解决 SSR 兼容性问题
- 📱 响应式设计，支持移动端
- 🎨 现代化赛博朋克风格 UI
- ⚡ 性能优化，减少首次加载时间
