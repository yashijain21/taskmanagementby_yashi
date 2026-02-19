# Task Manager Backend

## Setup

1. Install dependencies:
   - `npm install`
2. Copy env file:
   - `copy .env.example .env`
3. Generate Prisma client and create DB:
   - `npm run prisma:generate`
   - `npm run prisma:push`
4. Start dev server:
   - `npm run dev`

## Required Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `PATCH /tasks/:id/toggle`
