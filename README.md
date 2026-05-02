# ChatBot

A ChatGPT-like conversation system built with Next.js and Express.

## Architecture

```
┌──────────────────────────────────────────────┐
│  Next.js Frontend (:3000)                    │
│  Login / Chat / Settings / Usage Dashboard   │
└──────────────────┬───────────────────────────┘
                   │ HTTP / SSE
┌──────────────────▼───────────────────────────┐
│  Express Backend (:3001)                     │
│  ┌─────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ Auth    │ │ Chat      │ │ Usage        │  │
│  │ (JWT)   │ │ (SSE)     │ │ Analytics    │  │
│  └─────────┘ └───────────┘ └──────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ Provider Adapters: DeepSeek / OpenAI /   │  │
│  │ Anthropic with streaming SSE             │  │
│  └──────────────────────────────────────────┘  │
└──────────┬───────────────┬────────────────────┘
           │               │
    ┌──────▼──────┐ ┌──────▼──────┐
    │ PostgreSQL  │ │    Redis    │
    │ (Prisma ORM)│ │ (Rate Limit)│
    └─────────────┘ └─────────────┘
```

## Features

- Multi-model AI chat (DeepSeek, GPT-4, Claude) with streaming SSE responses
- Conversation management with search and full-text indexing
- User authentication with JWT + refresh token rotation
- Usage tracking dashboard with token/cost analytics
- Markdown rendering with code highlighting and LaTeX math
- Rate limiting with Redis (in-memory fallback)
- Dark mode responsive UI with accessibility support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, Recharts |
| Backend | Node.js 20, Express, TypeScript, Zod |
| Database | PostgreSQL 17, Prisma ORM |
| Cache | Redis 7 |
| AI | DeepSeek, OpenAI, Anthropic |
| Deployment | Docker Compose, Nginx |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- DeepSeek API key (or OpenAI/Anthropic)

### Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env: set DEEPSEEK_API_KEY=sk-your-key

# 3. Start PostgreSQL and Redis
docker compose up -d

# 4. Run database migrations
cd server && npx prisma migrate deploy && cd ..

# 5. Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production

```bash
docker compose -f docker-compose.yml up -d
```

Or build the Docker image:
```bash
docker build -t chatbot .
```

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Sign out |

### Conversations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/conversations` | Create conversation |
| GET | `/api/conversations` | List (paginated) |
| GET | `/api/conversations/search?q=` | Full-text search |
| PATCH | `/api/conversations/:id` | Rename |
| DELETE | `/api/conversations/:id` | Delete |
| GET | `/api/conversations/:id/messages` | Get messages |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/stream` | SSE streaming chat |
| GET | `/api/chat/models` | List available models |

### Config
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | List API configs (masked) |
| POST | `/api/config` | Add/update API key |
| DELETE | `/api/config/:provider` | Remove API key |
| PATCH | `/api/config/:provider/toggle` | Enable/disable |

### Usage
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/usage?range=day|week|month` | Usage statistics |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |

## Project Structure

```
├── client/              # Next.js frontend
│   ├── app/             # Pages (login, register, chat, settings, usage)
│   ├── components/      # UI components (sidebar, chat view, message rendering)
│   ├── lib/             # API client, SSE client
│   ├── store/           # Zustand stores (auth, chat)
│   └── types/           # TypeScript types
├── server/              # Express backend
│   ├── src/
│   │   ├── middleware/  # Auth, rate limiting
│   │   ├── providers/   # DeepSeek, OpenAI, Anthropic adapters
│   │   ├── routes/      # API route handlers
│   │   └── services/    # Context management, encryption
│   └── prisma/          # Database schema and migrations
├── docker-compose.yml   # PostgreSQL + Redis
├── Dockerfile           # Production multi-stage build
└── nginx.conf           # Reverse proxy configuration
```

## Security

- JWT access tokens (15min) + refresh tokens (7d) with HttpOnly cookies
- Refresh token rotation with replay attack detection
- Prompt injection defense on all user input
- CORS restricted to frontend origin
- Helmet.js security headers
- Rate limiting: 20 req/min per user (chat), 10 req/5min per IP (auth)
- API keys encrypted with AES-256-CBC in database

## License

MIT
