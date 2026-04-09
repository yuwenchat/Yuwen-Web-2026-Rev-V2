# 语闻

语闻是一个为 `1 对 1` 私密沟通设计的 Web 优先聊天应用。这个仓库实现了首发版本的 monorepo 骨架，覆盖：

- `Next.js PWA` 网页端界面
- `NestJS + Socket.IO` API 与实时层
- `Prisma/PostgreSQL` 数据模型
- 共享协议、聊天状态层、设计语义和加密扩展接口
- 邮箱验证码、magic link、密码登录的统一认证通道
- `friendCode` 刷新、`@handle`、已读、正在输入、消息编辑、删除给自己/双方

## 工作区结构

- `apps/web`: Next.js App Router Web 客户端
- `apps/api`: NestJS API、Socket.IO、Prisma schema
- `packages/protocol`: REST/WS 协议、Zod schema、核心类型
- `packages/chat-core`: 客户端聊天状态 reducer 与选择器
- `packages/design-system`: 颜色、文案语义、状态标签
- `packages/crypto`: E2EE 预留接口与 emoji 指纹占位逻辑

## 快速开始

1. 安装 Node.js 22+ 和 `pnpm`
2. 复制环境变量：

```bash
cp .env.example .env
```

3. 安装依赖：

```bash
pnpm install
```

4. 生成 Prisma Client：

```bash
pnpm db:generate
```

5. 启动开发环境：

```bash
pnpm dev
```

## 当前实现状态

- Web 端已提供可交互的高保真演示界面，用共享 reducer 模拟聊天、编辑、删除、已读、typing、friend code 刷新等行为
- API 层已搭建完整模块结构、核心 REST 路由、Socket Gateway、邮件 provider 接口和 Prisma schema
- E2EE 只做了协议与视觉预留，首版文案不会误导成“端对端加密已开启”

## 后续建议

- 安装依赖后先运行 `pnpm typecheck && pnpm test`
- 确认飞书 SMTP 授权配置是否已开启
- 补全 Redis presence/typing 状态存储与队列化限流
- 用真实数据库和前端 API client 替换演示数据

