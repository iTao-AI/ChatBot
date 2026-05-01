FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
WORKDIR /app
COPY . .
RUN cd client && npm ci && npx next build
RUN cd server && npm ci && npx prisma generate && npm run build

FROM base AS production
WORKDIR /app
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/next.config.ts ./client/next.config.ts
COPY --from=builder /app/client/package.json ./client/package.json
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000 3001
CMD ["node", "server/dist/index.js"]
