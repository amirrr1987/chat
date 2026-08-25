# ArazChat

pnpm + Turborepo monorepo — real-time chat (direct + group) with mobile/password auth.

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm, Turborepo |
| API | NestJS, TypeORM, PostgreSQL, Redis, Passport JWT, Socket.IO, bcryptjs, Zod |
| Web | Vue 3, Ionic, Pinia, TanStack Query, VueUse, Axios, PWA |
| Infra | Docker, docker-compose |

## Ports

| Service | Port |
|---------|------|
| Web | **7070** |
| API | **7071** |
| Postgres | **7072** |
| Redis | **7073** |

## Quick start

```bash
# 1. Start Postgres + Redis
docker compose up postgres redis -d

# 2. Install & run
pnpm install
pnpm dev
```

- Web: http://localhost:7070
- API: http://localhost:7071

## Register

Mobile format: `09xxxxxxxxx` + password (min 6 chars).

## Features

- Direct (1:1) and group chats
- Text + image messages
- Edit / delete messages
- Sent / delivered / read receipts
- Sessions + refresh tokens
- Profile / avatar / settings
- Last seen
- fa / en (SPA)
- Redis online presence
- Ionic PWA

## Project structure

```
apps/
  api/     NestJS backend
  web/     Vue + Ionic PWA
packages/
  shared/  Zod schemas + shared types
```

## Docker (full stack)

```bash
docker compose up --build
```

Web `:7070` · API `:7071` · Postgres `:7072` · Redis `:7073`
