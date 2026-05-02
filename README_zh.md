[English](./README.md) | [中文](./README_zh.md)

# ChatBot

一个基于 Next.js 和 Express 的类 ChatGPT 对话系统。

## 架构

```
┌──────────────────────────────────────────────┐
│  Next.js 前端（:3000）                        │
│  登录 / 对话 / 设置 / 用量仪表盘               │
└──────────────────┬───────────────────────────┘
                   │ HTTP / SSE
┌──────────────────▼───────────────────────────┐
│  Express 后端（:3001）                        │
│  ┌─────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ 认证    │ │ 聊天      │ │ 用量分析     │  │
│  │ (JWT)   │ │ (SSE)     │ │              │  │
│  └─────────┘ └───────────┘ └──────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ 提供商适配器：DeepSeek / OpenAI /        │  │
│  │ Anthropic，支持 SSE 流式响应              │  │
│  └──────────────────────────────────────────┘  │
└──────────┬───────────────┬────────────────────┘
           │               │
    ┌──────▼──────┐ ┌──────▼──────┐
    │ PostgreSQL  │ │    Redis    │
    │ (Prisma ORM)│ │ (限流)      │
    └─────────────┘ └─────────────┘
```

## 核心功能

- **多模型 AI 聊天**：DeepSeek、GPT-4、Claude，支持 SSE 流式响应
- **对话管理**：搜索和全文索引
- **用户认证**：JWT + 刷新令牌轮换
- **用量仪表盘**：Token/费用分析
- **Markdown 渲染**：代码高亮 + LaTeX 数学公式
- **限流**：Redis（内存回退）
- **暗色模式**：响应式 UI + 无障碍支持

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, Recharts |
| 后端 | Node.js 20, Express, TypeScript, Zod |
| 数据库 | PostgreSQL 17, Prisma ORM |
| 缓存 | Redis 7 |
| AI | DeepSeek, OpenAI, Anthropic |
| 部署 | Docker Compose, Nginx |

## 快速开始

### 前置要求

- Node.js 20+
- Docker 和 Docker Compose
- DeepSeek API 密钥（或 OpenAI/Anthropic）

### 开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境
cp .env.example .env
# 编辑 .env：设置 DEEPSEEK_API_KEY=sk-your-key

# 3. 启动 PostgreSQL 和 Redis
docker compose up -d

# 4. 运行数据库迁移
cd server && npx prisma migrate deploy && cd ..

# 5. 同时启动前后端
npm run dev
```

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001

## API 端点

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| POST | `/api/auth/logout` | 登出 |

### 对话
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/conversations` | 创建对话 |
| GET | `/api/conversations` | 列表（分页） |
| GET | `/api/conversations/search?q=` | 全文搜索 |
| PATCH | `/api/conversations/:id` | 重命名 |
| DELETE | `/api/conversations/:id` | 删除 |

### 聊天
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat/stream` | SSE 流式聊天 |
| GET | `/api/chat/models` | 列出可用模型 |

## 安全性

- JWT 访问令牌（15 分钟）+ 刷新令牌（7 天），HttpOnly Cookie
- 刷新令牌轮换 + 重放攻击检测
- 所有用户输入的提示词注入防御
- CORS 限制为前端域名
- Helmet.js 安全头
- 限流：20 次/分钟（聊天），10 次/5 分钟（认证）
- API 密钥在数据库中使用 AES-256-CBC 加密

## License

MIT
