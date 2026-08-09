# ISA Link — Social Platform

**International Student Association · "Empowered To Succeed"**

A full-stack social media platform for international students, built with Next.js 14, TypeScript, Prisma, PostgreSQL, Socket.io, and TweetNaCl E2E encryption.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDRMCHK%2FISA&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,CLOUDINARY_CLOUD_NAME,CLOUDINARY_API_KEY,CLOUDINARY_API_SECRET&envDescription=Fill%20in%20your%20environment%20variables&project-name=isa-link&repository-name=ISA)

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
| Deployment | Vercel / Railway / Render / Docker |

---

## Prerequisites

### For Local Development

1. **Node.js 20+** — [nodejs.org](https://nodejs.org)
2. **PostgreSQL 14+** — [postgresql.org](https://www.postgresql.org/download/) or use Docker:
   ```bash
   docker run --name isa-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=isa_link \
     -p 5432:5432 -d postgres:16
   ```
3. **Cloudinary account** (free tier works) — [cloudinary.com](https://cloudinary.com)

### For Production Deployment

- **Vercel account** (free) — [vercel.com](https://vercel.com)
- **PostgreSQL database** (e.g., Supabase, Railway, or AWS RDS)
- **GitHub account** for deployment automation

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/DRMCHK/ISA.git
cd ISA
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — run: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- `NEXTAUTH_URL` — `http://localhost:3000` (development) or your domain (production)
- `CLOUDINARY_*` — from your Cloudinary dashboard
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — initial admin credentials

### 3. Initialize Database

```bash
npm run db:migrate    # Create tables
npm run db:seed       # Create admin account
```

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the login page.

---

## Docker (Recommended for Production)

### Using Docker Compose (simplest)

```bash
# Create .env file with your values
cp .env.example .env

# Start PostgreSQL + app
docker-compose up -d

# Initialize database
docker exec isa_app npm run db:migrate
docker exec isa_app npm run db:seed

# View logs
docker-compose logs -f app
```

Then visit [http://localhost:3000](http://localhost:3000).

### Manual Docker Build

```bash
docker build -t isa-link .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="..." \
  isa-link
```

---

## Deploy to Production

### Option 1: Vercel (Recommended, Free)

**One-click deploy:**

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDRMCHK%2FISA&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,CLOUDINARY_CLOUD_NAME,CLOUDINARY_API_KEY,CLOUDINARY_API_SECRET&envDescription=Fill%20in%20your%20environment%20variables&project-name=isa-link&repository-name=ISA)

**Manual steps:**
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → Select this repo
3. Configure environment variables (from `.env.example`)
4. Click Deploy

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically deploy on every push to `main`.

### Option 2: Railway.app (Free tier)

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → Create Project → Deploy from GitHub
3. Select this repo
4. Add PostgreSQL plugin
5. Add environment variables
6. Deploy

### Option 3: Render.com

1. Push to GitHub
2. Go to [render.com](https://render.com) → Create → Web Service
3. Connect your GitHub repo
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Create a PostgreSQL resource
7. Add environment variables from `.env.example`

### Option 4: Self-hosted (VPS, AWS, DigitalOcean)

```bash
# Clone repo on your server
git clone https://github.com/DRMCHK/ISA.git
cd ISA

# Setup environment
cp .env.example .env
# Edit .env with production values

# Build with Docker
docker build -t isa-link .
docker run -d -p 3000:3000 --restart=always isa-link

# Or use Docker Compose
docker-compose up -d
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides for each platform.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server (Next.js + Socket.io on :3000) |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Create admin account |
| `npm run db:studio` | Open Prisma Studio UI |
| `npm run db:reset` | **Dangerous**: wipe & reset database |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint checks |

---

## Project Structure

```
app/                    Next.js 14 App Router
  api/                  REST + Socket.io endpoints
  (auth)/               Auth pages (login, register)
  (main)/               Protected app pages (feed, messages, groups)
  admin/                Admin panel (ADMIN role only)
  layout.tsx            Root layout + providers
  globals.css           Global styles

components/
  layout/               Header, Sidebar
  messages/             Chat UI (ChatWindow, MessageBubble)
  groups/               Group management (GroupClient)
  profile/              User profile (ProfileClient)
  providers/            React providers (Theme, Auth, Socket)
  ui/                   Reusable components (PostCard, Avatar, etc)

lib/                    Server-side utilities
  auth.ts               NextAuth configuration
  socket.ts             Socket.io server logic
  moderation.ts         Content moderation
  encryption.ts         TweetNaCl E2E wrappers
  cloudinary.ts         Image upload
  rate-limit.ts         Per-user rate limiting

prisma/
  schema.prisma         Database schema
  seed.ts               Admin seeder

types/                  TypeScript definitions

server.ts               Custom Next.js + Socket.io server
middleware.ts           Route protection
```

### Request Flow

<<<<<<< Updated upstream
1. **Public pages** → `/login`, `/register` (no auth required)
2. **Protected routes** → middleware checks `next-auth` session token
3. **Socket.io** → real-time messaging via `/api/socket` endpoint
4. **Database** → Prisma queries (server-side only, never from client)
5. **Media** → uploads to Cloudinary, returns signed URLs
6. **E2E Encryption** → TweetNaCl on client-side for DMs only
=======
## Deploy to Railway (Recommended)

1. Push code to GitHub
2. Create a new project at [railway.app](https://railway.app)
3. Add a **PostgreSQL** plugin
4. Connect your GitHub repository
5. Add all environment variables from `.env.example`
6. Deploy

Railway will auto-detect the `railway.json` config and use the Dockerfile.

## Deploy to Render (Blueprint)

The repo includes a [`render.yaml`](render.yaml) Blueprint that provisions both the web service and a free PostgreSQL database.

### 1. Push to GitHub

Ensure your latest code is pushed to a GitHub repository.

### 2. Create the Blueprint

1. Go to [render.com](https://render.com) and sign in
2. Click **New** → **Blueprint**
3. Connect your GitHub account and select this repository
4. Render reads `render.yaml` and shows the resources it will create:
   - **isa-link** — Node.js web service
   - **isa-link-db** — PostgreSQL database

### 3. Fill in environment variables

When prompted, set these secrets (`sync: false` in the Blueprint):

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | Your Render URL, e.g. `https://isa-link.onrender.com` (use the URL Render assigns after deploy) |
| `CLOUDINARY_CLOUD_NAME` | From your [Cloudinary dashboard](https://cloudinary.com) |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `ADMIN_SEED_EMAIL` | Admin login email |
| `ADMIN_SEED_PASSWORD` | Strong password (12+ chars, uppercase, lowercase, digit, symbol) |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Optional — moderation works without it |

`NEXTAUTH_SECRET` and `DATABASE_URL` are set automatically by the Blueprint.

### 4. Deploy

Click **Apply**. Render will:

1. Build the app (`npm ci && npm run build`)
2. Run migrations (`npx prisma migrate deploy`)
3. Start the server (`npm start`)
4. Seed the admin account once (`npm run db:seed`)

Check the deploy logs for the admin private key — it is printed only once during seeding.

### 5. Post-deploy checklist

1. Confirm health: `GET https://<your-app>.onrender.com/api/health` returns `{ "status": "ok" }`
2. Update `NEXTAUTH_URL` in the Render Dashboard if you used a placeholder during setup
3. Log in with your admin credentials and visit `/admin`
4. Test image upload (requires Cloudinary vars)
5. Test realtime messaging (Socket.io at `/api/socket`)

### Free tier notes

- **Web service** spins down after ~15 minutes of inactivity; the first visit after idle may take 30–60 seconds (cold start)
- **Free PostgreSQL** expires **30 days** after creation — upgrade to a paid plan for long-lived deployments
- WebSockets (Socket.io) are supported on free web services
>>>>>>> Stashed changes

---

## Features

- ✅ **Social Feed** — posts with images, videos, links, reactions
- ✅ **Content Moderation** — word blacklist + Google Safe Browsing API
- ✅ **E2E Encrypted DMs** — TweetNaCl encryption, server-side blind
- ✅ **Real-time Messaging** — Socket.io with online/offline status
- ✅ **Friend System** — send/accept/block users
- ✅ **Groups** — create groups, invite links, moderated chat
- ✅ **Admin Panel** — manage users, posts, reports, groups
- ✅ **Dark/Light Mode** — client-side theme persistence
- ✅ **Rate Limiting** — 30 requests/min per user
- ✅ **Input Sanitization** — XSS protection on all endpoints
- ✅ **Strong Passwords** — enforced for admin accounts

---

## Security Notes

⚠️ **Before going to production:**

1. **Change `NEXTAUTH_SECRET`** — never use the default
2. **Restrict database access** — use connection whitelisting
3. **Enable HTTPS** — production URL must be `https://`
4. **Strong admin password** — use the seed password temporarily, change immediately
5. **Rate limiting** — adjust if needed for your user base

### Encryption Details

- **DM Content** — encrypted with NaCl box cipher, server stores ciphertext unreadably
- **Private Keys** — stored in browser `localStorage`, never sent to server
- **Group Messages** — NOT E2E encrypted, admins can moderate them
- **Database** — use SSL connection to PostgreSQL in production

---

## Troubleshooting

### "ECONNREFUSED" on `npm run dev`

Database is not running. Start PostgreSQL:

```bash
# If using Docker
docker run --name isa-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=isa_link \
  -p 5432:5432 -d postgres:16

# Or if using local PostgreSQL
brew services start postgresql@16
```

### "PrismaClientInitializationError"

Database URL is wrong or database doesn't exist. Check:
1. `DATABASE_URL` in `.env.local`
2. PostgreSQL is running: `psql postgres://...`
3. Run migrations: `npm run db:migrate`

### Socket.io connection fails

- Check that Socket.io path is correct in `.env.local`
- Verify `NEXTAUTH_URL` matches your domain
- Check CORS settings in `server.ts` match your frontend URL

### Cloudinary uploads fail

- Verify `CLOUDINARY_*` variables are set
- Check Cloudinary dashboard for API key validity
- Ensure account has upload permissions

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting issues, submitting PRs, and improving the codebase.

---

## License

ISA Link is open source under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## Support

- 📧 Report bugs: [GitHub Issues](https://github.com/DRMCHK/ISA/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/DRMCHK/ISA/discussions)
- 🐛 Security issues: [Report privately](https://github.com/DRMCHK/ISA/security)

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] AI-powered content recommendations
- [ ] Video chat via WebRTC
- [ ] Blockchain verification (future)
- [ ] Multi-language support

---

**Made with ❤️ for international students**
