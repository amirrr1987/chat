# ---- build ----
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY scripts ./scripts
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @arazchat/shared build
RUN pnpm --filter @arazchat/api build

# ---- runtime (keep workspace layout so pnpm links resolve) ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

WORKDIR /app/apps/api
RUN mkdir -p uploads && chown -R app:app /app
USER app
EXPOSE 7071
CMD ["node", "dist/main.js"]
