# Task Management System (Full-Stack)

This repository contains a complete assessment solution with separate folders:

- `backend` -> Node.js + TypeScript + Express + Prisma (SQLite)
- `frontend` -> Next.js (App Router) + TypeScript

## 1. Run Backend

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:push
npm run dev
```

Backend runs on `http://localhost:4000`.

## 2. Run Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Implemented Features

- Registration, login, refresh token, logout
- Password hashing with `bcrypt`
- JWT access token + refresh token flow
- Protected task CRUD by authenticated user
- Task list pagination + status filter + title search
- Responsive web dashboard with create/edit/delete/toggle
- Toast notifications for task/auth actions
