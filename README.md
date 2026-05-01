# ChatBot

A ChatGPT-like conversation system built with Next.js and Express.

## Features

- Multi-model AI chat (GPT-4, Claude) with streaming SSE responses
- Conversation management with search and full-text indexing
- User authentication with JWT + refresh token rotation
- Usage tracking dashboard with token/cost analytics
- Markdown rendering with code highlighting and LaTeX math
- Rate limiting with Redis (in-memory fallback)
- Dark mode responsive UI with accessibility support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand, Recharts |
| Backend | Node.js 20, Express, TypeScript, Zod |
| Database | PostgreSQL 17, Prisma ORM |
| Cache | Redis 7 |
| AI | OpenAI SDK, Anthropic SDK |
| Deployment | Docker Compose, Nginx |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- OpenAI API key and/or Anthropic API key

### Development

1. Clone and install:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Start infrastructure:
```bash
docker compose up -d
```

4. Run database migrations:
```bash
cd server && npx prisma migrate dev
```

5. Start both servers:
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API docs: http://localhost:3001/api/health

### Testing

```bash
npm test
```

### Production Deployment

```bash
docker compose -f docker-compose.yml up -d
```

Or build the production image:
```bash
docker build -t chatbot .
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Sign in
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Sign out

### Conversations
- `POST /api/conversations` — Create conversation
- `GET /api/conversations` — List (paginated)
- `GET /api/conversations/search?q=...` — Full-text search
- `PATCH /api/conversations/:id` — Rename
- `DELETE /api/conversations/:id` — Delete
- `GET /api/conversations/:id/messages` — Get messages
- `POST /api/conversations/:id/messages` — Save message

### Chat
- `POST /api/chat/stream` — SSE streaming chat
- `GET /api/chat/models` — List available models

### Usage
- `GET /api/usage?range=day|week|month` — Usage statistics

### Health
- `GET /api/health` — Health check

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
│   │   ├── providers/   # OpenAI, Anthropic adapters
│   │   ├── routes/      # API route handlers
│   │   └── services/    # Context management, injection defense
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

## License

MIT
