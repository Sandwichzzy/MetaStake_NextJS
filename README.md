# MetaStake V1 - 质押项目

这是一个基于 Next.js 的区块链质押项目，使用 viem 和 wagmi 进行区块链交互。

## 项目架构

### 技术栈

- **前端框架**: Next.js 14
- **区块链交互**: viem + wagmi
- **钱包连接**: RainbowKit
- **样式**: Tailwind CSS
- **状态管理**: TanStack Query
- **语言**: TypeScript

### 项目结构

```
stake-fev2/
├── src/
│   ├── abis/           # 智能合约ABI定义
│   ├── app/            # Next.js应用页面
│   ├── hooks/          # 自定义React Hooks
│   └── utils/          # 工具函数
│       ├── viem.ts     # viem客户端配置
│       └── contractHelper.ts  # 合约操作封装
├── package.json
└── README.md
```

## 核心功能

### 1. 区块链客户端配置 (`src/utils/viem.ts`)

提供完整的区块链客户端配置，支持多链操作：

- **支持的链**: Sepolia 测试网、以太坊主网
- **客户端类型**: 公共客户端（只读）、钱包客户端（读写）
- **配置选项**: 链选择、RPC URL、WebSocket URL

#### 主要功能

- `viemClients()`: 创建公共和钱包客户端
- `createPublicClient()`: 创建只读客户端
- `createWalletClient()`: 创建读写客户端
- `getChainById()`: 根据链 ID 获取链信息
- `isChainSupported()`: 检查链是否支持

#### 使用示例

```typescript
import { viemClients, createPublicClient } from "./utils/viem";

// 使用默认配置（Sepolia测试网）
const { publicClient, walletClient } = viemClients();

// 自定义配置
const customClient = createPublicClient({
  chain: mainnet,
  rpcUrl: "https://mainnet.infura.io/v3/YOUR_API_KEY",
});
```

### 2. 合约操作封装 (`src/utils/contractHelper.ts`)

提供完整的智能合约操作封装，支持读写操作：

#### 核心功能

- **合约实例创建**: `createContractInstance()`
- **读取操作**: `readContract()`
- **写入操作**: `writeContract()`
- **批量读取**: `batchReadContract()`
- **事件监听**: `getContractEvents()`

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
import { createStakeContract } from "./utils/contractHelper";

// 创建质押合约实例
const stakeContract = createStakeContract(
  "0x...", // 合约地址
  { chain: sepolia } // 链配置
);

// 读取操作
const poolLength = await stakeContract.getPoolLength();
const userBalance = await stakeContract.getStakingBalance(0n, userAddress);

// 写入操作
const txHash = await stakeContract.deposit(0n, amount, account);
```

## 页面结构

### 主要页面

- **首页** (`/`): 项目介绍和主要功能入口
- **质押页面** (`/stake`): 质押代币和 ETH
- **提现页面** (`/withdraw`): 提现质押的代币
- **奖励页面** (`/rewards`): 查看和领取奖励

### 布局结构

- **响应式设计**: 支持桌面和移动设备
- **现代化 UI**: 使用 Tailwind CSS 构建美观界面
- **钱包集成**: 支持多种钱包连接

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

- `NEXT_PUBLIC_INFURA_PROJECT_ID`: Infura 项目 ID
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: 质押合约地址
- `NEXT_PUBLIC_CHAIN_ID`: 目标链 ID

### 网络配置

- **Sepolia 测试网**: 默认测试环境
- **以太坊主网**: 生产环境

## 安全特性

- **权限控制**: 基于角色的访问控制
- **暂停机制**: 紧急情况下可暂停关键功能
- **升级机制**: 支持合约升级
- **事件记录**: 完整的操作事件记录

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issues
- 邮箱: [your-email@example.com]

---

**注意**: 这是一个质押项目，涉及金融操作，请在使用前充分了解相关风险。
