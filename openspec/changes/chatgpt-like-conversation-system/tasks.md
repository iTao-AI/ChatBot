## 1. Project Setup

- [x] 1.1 Initialize monorepo structure: `server/` (backend) + `client/` (frontend)
- [x] 1.2 Create backend: Node.js + Express + TypeScript project with `tsconfig.json`, `package.json`
- [x] 1.3 Create frontend: Next.js App Router + TypeScript + Tailwind CSS project
- [x] 1.4 Set up Docker Compose with PostgreSQL and Redis services
- [x] 1.5 Configure Prisma ORM in backend with `User`, `Conversation`, `Message` models
- [x] 1.5.1 Add database indexes: Conversation(userId, updatedAt), Message(conversationId, createdAt)
- [x] 1.5.2 Configure PostgreSQL full-text search (tsvector) on Conversation.title and Message.content via Prisma raw SQL migration
- [x] 1.6 Add ESLint + Prettier configuration to both client and server
- [x] 1.7 Set up environment variable templates (`.env.example`)

## 2. User Authentication

- [x] 2.1 Implement `/api/auth/register` endpoint with email/password validation and bcrypt hashing
- [x] 2.2 Implement `/api/auth/login` endpoint returning JWT access token + refresh token (HttpOnly cookie)
- [x] 2.3 Implement `/api/auth/refresh` endpoint for token rotation
- [x] 2.3.1 Implement refresh token rotation: generate new refresh token on each refresh, invalidate old token, detect replay attacks and revoke entire session
- [x] 2.4 Implement `/api/auth/logout` endpoint with refresh token invalidation
- [x] 2.5 Create JWT authentication middleware for protected routes
- [x] 2.6 Build frontend login page with form validation
- [x] 2.7 Build frontend registration page with form validation
- [x] 2.8 Implement frontend auth state management (Zustand store for user + tokens)
- [x] 2.9 Add protected route guard in Next.js middleware

## 3. Conversation Management

- [x] 3.1 Implement `POST /api/conversations` endpoint to create a new conversation
- [x] 3.2 Implement `GET /api/conversations` endpoint with pagination and updatedAt sorting
- [x] 3.3 Implement `DELETE /api/conversations/:id` endpoint with ownership check
- [x] 3.4 Implement `PATCH /api/conversations/:id` endpoint for renaming
- [x] 3.5 Implement `GET /api/conversations/:id/messages` endpoint returning chronologically ordered messages
- [x] 3.6 Implement message save service for persisting user and assistant messages
- [x] 3.7 Build frontend sidebar with conversation list (create, delete, rename UI)
- [x] 3.8 Build frontend message history view with scroll-to-bottom on load
- [x] 3.9 Implement conversation search: frontend filtering by title + content matching
- [x] 3.10 Add PostgreSQL full-text search index (tsvector) on conversation title and message content

## 4. AI Chat Backend

- [x] 4.1 Define unified `ChatProvider` interface with `chat()` and `streamChat()` methods
- [x] 4.2 Implement OpenAI provider adapter (gpt-3.5-turbo, gpt-4)
- [x] 4.3 Implement Anthropic provider adapter (claude-sonnet, claude-opus)
- [x] 4.4 Build provider routing service: route by model registry lookup (NOT by model name prefix — prefixes like "gpt-" are fragile, e.g., OpenAI's o1/o3 models)
- [x] 4.5 Implement model registry with metadata (provider, contextWindow, displayName, isDefault)
- [x] 4.6 Implement context window management: truncate oldest messages when exceeding limit
- [x] 4.7 Implement system prompt injection (default: "You are a helpful assistant.")
- [x] 4.7.1 Implement prompt injection defense: strip control characters, detect system prompt override attempts, wrap user input in delimiter tags before sending to LLM
- [x] 4.8 Implement `POST /api/chat/stream` SSE endpoint for streaming AI responses
- [x] 4.8.1 Implement SSE connection close detection (`res.on('close')`) and upstream LLM request cancellation via AbortController
- [x] 4.9 Implement response metadata capture: token usage, model, response time

## 5. Frontend Chat Interface

- [x] 5.1 Build main chat layout: sidebar (conversation list) + main area (messages + input)
- [x] 5.1.1 Define design system tokens: font scale, color palette (light + dark), spacing scale, border radius scale
- [x] 5.1.2 Define empty states for all screens: no conversations, no messages, no usage data (with warm copy + CTA button)
- [x] 5.1.3 Define loading states: skeleton screens for sidebar, message list, usage charts
- [x] 5.1.4 Define error states: API failure, network offline, stream interrupted (with retry action)
- [x] 5.1.5 Define guest → registered user flow: anonymous chat, registration prompt on first send, auto-link messages after signup
- [x] 5.2 Implement message input area with submit button and Enter-to-send shortcut
- [x] 5.3 Build message bubbles with user/assistant avatar and timestamp
- [x] 5.4 Implement SSE client using fetch + ReadableStream (not EventSource — EventSource only supports GET, we need POST for message body)
- [x] 5.5 Implement typewriter effect with blinking cursor during streaming
- [x] 5.6 Implement stream interruption: Stop button with AbortController, graceful SSE teardown, backend request cancellation
- [x] 5.7 Implement model selector dropdown in chat header
- [x] 5.8 Add loading states: sending indicator, initial stream delay

## 6. Message Rendering

- [x] 6.1 Integrate Markdown renderer (react-markdown or remark) for message content
- [x] 6.2 Configure syntax highlighting for code blocks (Prism.js or highlight.js)
- [x] 6.3 Add copy-to-clipboard button on each code block with "Copied!" feedback
- [x] 6.4 Integrate DOMPurify for XSS sanitization of rendered HTML
- [x] 6.5 Integrate LaTeX math rendering (KaTeX or react-katex) for `$$...$$` and `$...$` blocks
- [x] 6.6 Style message rendering: proper heading sizes, list indentation, table borders

## 7. Model Management

- [x] 7.1 Implement `GET /api/models` endpoint returning available models with metadata
- [x] 7.2 Load provider configurations from environment variables on server startup
- [x] 7.3 Implement API key encryption/decryption service for database storage
- [x] 7.4 Implement admin endpoints for adding/updating/rotating API keys
- [x] 7.5 Build frontend settings page with model selection and API key management UI

## 8. Usage Statistics Dashboard

- [x] 8.1 Implement usage tracking middleware: capture tokens, model, timestamp per request
- [x] 8.2 Implement `GET /api/usage` endpoint with daily/weekly/monthly aggregation
- [x] 8.3 Implement PostgreSQL aggregation queries (GROUP BY DATE_TRUNC, SUM for tokens/cost)
- [x] 8.4 Build frontend usage dashboard with charts (Recharts): tokens/day, cost, request count
- [x] 8.5 Add per-model breakdown in usage dashboard

## 9. Rate Limiting & Security

- [x] 9.1 Set up Redis connection and health check
- [x] 9.2 Implement per-user chat rate limiter (configurable per-minute and per-day limits)
- [x] 9.3 Implement IP-based rate limiter for auth endpoints (10 attempts / 5 min)
- [x] 9.4 Add rate limit response headers (`X-RateLimit-*`) to all API responses
- [x] 9.5 Implement Redis fallback to in-memory rate limiting when Redis is unavailable
- [x] 9.6 Add CORS configuration restricting to frontend origin
- [x] 9.7 Add Helmet.js security headers middleware
- [x] 9.8 Implement input validation and sanitization on all endpoints

## 10. Testing

- [x] 10.1 Configure Vitest in backend (ts-jest or vitest + tsconfig)
- [x] 10.2 Write unit tests for auth middleware: valid token, expired token, missing token
- [x] 10.3 Write unit tests for provider routing service: known model prefix, unknown model
- [x] 10.4 Write unit tests for rate limiter: within limit, over limit, Redis fallback
- [x] 10.5 Write integration tests for API endpoints: POST /api/auth/register, POST /api/auth/login, POST /api/chat/stream
- [x] 10.6 Configure frontend testing (Vitest + React Testing Library)
- [x] 10.7 Write component tests: message rendering (markdown, code, LaTeX), chat input, conversation list
- [x] 10.8 Write SSE client test: stream parsing, error handling, reconnection

## 11. Polish & Deployment

- [x] 11.1 Add dark mode toggle with CSS variables and localStorage persistence
- [x] 11.2 Add responsive design for mobile (sidebar collapses to hamburger menu)
- [x] 11.2.1 Add keyboard navigation: tab order, focus visible indicators, Escape to close dialogs
- [x] 11.2.2 Add ARIA landmarks and screen reader labels for all interactive elements
- [x] 11.2.3 Add color contrast check: all text meets WCAG AA (4.5:1 ratio), touch targets 44px minimum
- [x] 11.3 Add error boundaries and user-friendly error messages
- [x] 11.4 Write API documentation (OpenAPI/Swagger spec)
- [x] 11.5 Configure Nginx reverse proxy for production (SSL, static assets, API proxy)
- [x] 11.6 Build Docker production images with multi-stage builds
- [x] 11.7 Add health check endpoint (`GET /api/health`)
- [x] 11.8 Write README with setup, development, and deployment instructions
