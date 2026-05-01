## Why

构建一个类 ChatGPT 的对话问答系统，为用户提供流畅的多轮对话体验。系统需要支持实时流式响应、多会话管理、Markdown 渲染、代码高亮等核心功能，同时具备可扩展的架构以支持未来接入不同 AI 模型。

## What Changes

- 搭建前后端分离的项目基础架构
- 实现用户注册/登录与会话管理（Guest-first 流程：先试用后注册）
- 实现 AI 对话核心能力：流式输出、多轮上下文、多模型切换
- 实现前端聊天界面：消息气泡、Markdown/代码渲染、打字机效果、完整状态规范（加载/空/错误/成功）
- 实现会话历史列表与持久化存储
- 实现 API Key 管理与后端代理转发
- 添加基础的 Rate Limiting 和安全防护
- 加入无障碍访问规范（WCAG AA）和自定义设计系统

## Capabilities

### New Capabilities

- `user-auth`: 用户注册、登录、JWT 鉴权、Session 管理
- `conversation-management`: 创建/删除/重命名会话，会话列表持久化，消息历史检索
- `ai-chat`: 核心对话能力，流式 SSE 响应，多轮上下文维护，多模型切换（GPT-4 / Claude / 其他）
- `message-rendering`: 前端消息渲染，Markdown 解析，代码块语法高亮，LaTeX 数学公式支持
- `model-management`: 后端模型配置、API Key 管理、供应商路由（OpenAI / Anthropic / 其他）
- `rate-limiting`: 请求频率限制、配额管理、防滥用机制

### Modified Capabilities

<!-- 无已有规格 -->

## Impact

- **前端**: 新建 React/Next.js 应用，包含聊天界面、用户中心、设置页面
- **后端**: 新建 Node.js/Express 或 FastAPI 服务，包含认证、对话代理、流式 SSE 端点
- **数据库**: 引入 PostgreSQL 或 SQLite 存储用户、会话、消息数据
- **外部依赖**: OpenAI API / Anthropic API 等第三方 LLM 服务
- **基础设施**: Redis（缓存/Rate Limiting），Nginx（反向代理），Docker（容器化部署）
