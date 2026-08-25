# ---- build ----
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY scripts ./scripts
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @arazchat/shared build
RUN pnpm --filter @arazchat/web build

# ---- runtime ----
FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
