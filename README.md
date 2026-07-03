# ISA Link — Social Platform

**International Student Association · "Empowered To Succeed"**

A full-stack social media platform for international students, built with Next.js 14, TypeScript, Prisma, PostgreSQL, Socket.io, and TweetNaCl E2E encryption.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes + Custom Socket.io server |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | NextAuth.js (credentials) |
| Media | Cloudinary |
| DM Encryption | TweetNaCl (E2E, client-side keys) |
| Realtime | Socket.io (200+ connections) |

---

## Prerequisites

1. **Node.js 20+** — [nodejs.org](https://nodejs.org)
2. **PostgreSQL** — [postgresql.org](https://www.postgresql.org/download/windows/) or Docker:
   ```bash
   docker run --name isa-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=isa_link -p 5432:5432 -d postgres:16
   ```
3. **Cloudinary account** (free) — [cloudinary.com](https://cloudinary.com)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and fill in all values:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- `NEXTAUTH_URL` — your app URL (e.g., `http://localhost:3000`)
- `CLOUDINARY_*` — from your Cloudinary dashboard
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — initial admin credentials

### 3. Initialize database
```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Create the admin account
```

### 4. Start development server
```bash
npm run dev
```

App runs at **http://localhost:3000**

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server (Next.js + Socket.io) |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed initial admin account |
| `npm run db:studio` | Open Prisma Studio |
| `npm run type-check` | TypeScript type check |

---

## Project Structure

```
/app                    Next.js App Router pages & API routes
  /api                  REST API endpoints
  /(auth)               Login & Register pages
  /(main)               Protected app pages
  /admin                Admin panel (ADMIN role only)
/components
  /layout               Header, Sidebar
  /messages             ChatWindow, MessageBubble, MessagesClient
  /groups               GroupClient
  /profile              ProfileClient
  /providers            ThemeProvider, SessionProvider, SocketProvider
  /ui                   Avatar, PostCard, CreatePost, CommentSection, ReportModal, DarkModeToggle
/lib                    Server-side utilities
  prisma.ts             Prisma client singleton
  auth.ts               NextAuth configuration
  socket.ts             Socket.io server logic
  moderation.ts         Word blacklist + Safe Browsing API
  encryption.ts         TweetNaCl E2E wrappers
  cloudinary.ts         Media upload helpers
  rate-limit.ts         In-memory per-user rate limiter
/prisma
  schema.prisma         Full database schema
  seed.ts               Admin account seeder
/types                  TypeScript type definitions
server.ts               Custom server (Next.js + Socket.io)
middleware.ts           Route protection middleware
```

---

## Deploy to Railway (Recommended)

1. Push code to GitHub
2. Create a new project at [railway.app](https://railway.app)
3. Add a **PostgreSQL** plugin
4. Connect your GitHub repository
5. Add all environment variables from `.env.example`
6. Deploy

Railway will auto-detect the `railway.json` config and use the Dockerfile.

## Deploy to Render

1. Push to GitHub
2. Create a Web Service at [render.com](https://render.com)
3. Point to your repo, Render auto-reads `render.yaml`
4. Add a **PostgreSQL** database resource
5. Fill in environment variables

---

## Features

- ✅ Social feed with posts, images, videos, links
- ✅ Automatic content moderation (word blacklist + Safe Browsing API)
- ✅ E2E encrypted direct messages (TweetNaCl — server never reads content)
- ✅ Real-time messaging and presence via Socket.io
- ✅ Online/offline status (visible to friends only)
- ✅ Friend system (send/accept/block)
- ✅ Groups with invite links and real-time chat
- ✅ Anonymous reports & suggestions
- ✅ Admin panel (manage users, posts, reports, groups)
- ✅ Dark / Light mode (persisted in localStorage)
- ✅ Rate limiting (30 req/min per user)
- ✅ Input sanitization on all endpoints
- ✅ Strong password enforcement (admin accounts)

---

## Security Notes

- **Private keys** are stored only in the user's browser (`localStorage`). The server never sees them.
- **DM content** is encrypted with NaCl box — ciphertext stored in DB is unreadable by admins.
- **Group messages** are NOT E2E encrypted — admins can moderate them.
- Change `NEXTAUTH_SECRET` before going to production.
- Set strong database credentials and restrict DB access.
