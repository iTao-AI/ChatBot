## Context

从零构建一个类 ChatGPT 的对话问答系统。系统需要支持用户注册登录、多轮对话、流式响应、Markdown 渲染、代码高亮、多模型切换等核心功能。无现有代码库，采用前后端分离架构。

## Goals / Non-Goals

**Goals:**
- 提供完整的类 ChatGPT 用户体验：左侧会话列表 + 右侧聊天区域
- 支持流式 SSE 输出，打字机效果逐字显示
- 维护多轮对话上下文，自动管理 Token 窗口
- 支持多种 AI 模型切换（GPT-4、Claude 等）
- 用户数据持久化，会话历史可检索
- 安全的后端代理转发，不暴露 API Key 给前端
- 可扩展的架构，方便接入新的 LLM 供应商

**Non-Goals:**
- 不做文件上传/图片理解（多模态）
- 不做插件/工具调用（Function Calling）
- 不做团队/企业级多租户
- 不做微调/训练
- 不做知识库/RAG 检索增强

### User Experience Decisions

- **Guest-first flow**: 用户打开应用直接进入聊天界面，无需登录即可试用。首次发送消息或查看历史时才弹出注册提示。注册后自动关联匿名用户期间产生的对话。
- **Complete state coverage**: 每个 UI 组件必须定义五种状态（加载、空、错误、成功、部分完成），空状态需要有温度感文案和明确的下一步操作。
- **Accessibility baseline**: WCAG AA 级别无障碍，键盘导航完整支持，颜色对比度 4.5:1，触摸目标 44px 最小。
- **Design system**: 自定义设计 Token（字体比例、色板、间距比例、圆角），不使用 Tailwind 默认值。浅色 + 深色模式各一套。

## Decisions

### 1. 前端: Next.js + React 18 + TypeScript

**决策**: 使用 Next.js App Router + React 18 + TypeScript + Tailwind CSS。

**理由**: Next.js 提供 SSR/SSG 能力，路由管理方便；Tailwind CSS 加速 UI 开发；TypeScript 提升代码质量。

**替代方案**: Vite + React SPA —— 但缺少服务端渲染和 API 路由便利性。

### 2. 后端: Node.js + Express + TypeScript

**决策**: Node.js 20 + Express 框架 + TypeScript。

**理由**: 前端团队可直接复用 TypeScript 经验；Express 轻量灵活；Node.js 天然支持 SSE 流式推送。

**替代方案**: Python + FastAPI —— 但前后端技术栈不一致增加维护成本。

### 3. 数据库: PostgreSQL + Prisma ORM

**决策**: PostgreSQL 作为主数据库，Prisma 作为 ORM。

**理由**: PostgreSQL 成熟稳定、支持 JSON 字段（适合存储消息内容）；Prisma 提供类型安全的数据库访问。

**替代方案**: SQLite —— 开发阶段可用，生产推荐 PostgreSQL。

### 4. 实时通信: Server-Sent Events (SSE)

**决策**: 后端使用 SSE 推送流式 AI 响应，前端用 fetch + ReadableStream 接收（非原生 EventSource，因为 EventSource 只支持 GET）。

**理由**: SSE 是单向流式推送的标准方案，比 WebSocket 简单，原生支持断线重连。AI 对话场景只需服务端→客户端单向流。

**替代方案**: WebSocket —— 过于复杂，本场景不需要双向实时通信。

### 5. AI 模型接入: 统一抽象层 + 供应商适配器模式

**决策**: 定义统一的 `ChatProvider` 接口，为每个 LLM 供应商实现适配器（OpenAI、Anthropic 等）。

**理由**: 隔离供应商差异，新增供应商只需添加适配器；后端统一处理流式响应格式转换。

### 6. 认证: JWT (JSON Web Tokens)

**决策**: JWT Access Token (15min) + Refresh Token (7d) + HttpOnly Cookie。

**理由**: 无状态认证，水平扩展友好；HttpOnly Cookie 防止 XSS 窃取 Token。

### 7. 状态管理: Zustand (前端)

**决策**: Zustand 管理前端全局状态（当前会话、消息列表、用户信息）。

**理由**: 轻量简洁，API 友好，无需 Redux 样板代码。

### 8. 部署: Docker Compose + Nginx

**决策**: Docker 容器化所有服务，Nginx 作为反向代理。

**理由**: 一键启动所有依赖（app + db + redis）；Nginx 处理 SSL、静态资源、反向代理。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| LLM API 调用延迟高、可能超时 | 前端设置合理超时提示，后端实现重试机制 |
| Token 上下文窗口限制 | 后端按 token 计数动态截断（非固定 N 轮），从最旧消息开始逐条累加直到不超过模型窗口限制 |
| 流式 SSE 连接不稳定 | 前端实现断线重连 + 消息完整性校验 |
| API Key 泄露风险 | Key 仅存后端，使用环境变量或加密存储 |
| 多用户并发时数据库写入瓶颈 | 消息写入使用批量插入，会话列表加索引 |
| 前端 Markdown 渲染 XSS | 使用 DOMPurify 净化 HTML，禁用危险标签 |

## Migration Plan

1. 开发阶段使用 SQLite，通过 Prisma 一键切换到 PostgreSQL
2. Docker Compose 编排，本地 `docker compose up` 即可启动
3. 无存量数据迁移，首次部署即初始化 schema

## Open Questions

- 是否需要支持对话导出（Markdown/PDF 格式）？—— MVP 后可加
- 是否需要暗黑模式？—— 建议 MVP 包含
- 计费/配额策略如何设计？—— 基础 Rate Limiting 先做，精细计量化后续
