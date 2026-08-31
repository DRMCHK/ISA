# 🚀 Deploy ISA Link to Vercel

This guide will help you deploy your ISA Link application to Vercel.

## Prerequisites

1. **GitHub Account** - Your code must be pushed to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier available)
3. **Database** - You'll need a PostgreSQL database (Vercel doesn't provide one)
4. **Cloudinary Account** - For image uploads (free tier at [cloudinary.com](https://cloudinary.com))

---

## Step 1: Push Code to GitHub

```bash
# If you haven't already, add your remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin qwen-code-b6150a9c-33a9-4c1d-b601-07e0b51671d3
```

Or if you want to push to main branch:
```bash
git checkout main
git merge qwen-code-b6150a9c-33a9-4c1d-b601-07e0b51671d3
git push -u origin main
```

---

## Step 2: Set Up PostgreSQL Database

Vercel doesn't provide a database, so you have several options:

### Option A: Vercel Postgres (Recommended for simplicity)
1. Go to your Vercel dashboard
2. Click "Storage" → "Add Database" → "Vercel Postgres"
3. Create a new database
4. Copy the `POSTGRES_PRISMA_URL` connection string

### Option B: Neon (Free tier, great for Next.js)
1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string

### Option C: Render/Supabase/Railway
Any PostgreSQL provider works - just get the connection string.

---

## Step 3: Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose your ISA Link repository from GitHub
5. Click **"Import"**

---

## Step 4: Configure Environment Variables

In the Vercel project settings, go to **"Settings" → "Environment Variables"** and add:

### Required Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |
| `NEXTAUTH_URL` | `https://your-branch-your-app.vercel.app` | Preview |
| `NEXTAUTH_URL` | `http://localhost:3000` | Development |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | Production, Preview, Development |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | Production, Preview, Development |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | Production, Preview, Development |

### Optional Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `GOOGLE_SAFE_BROWSING_API_KEY` | Google Safe Browsing API key | Production, Preview, Development |
| `ADMIN_SEED_EMAIL` | `admin@isa-link.org` | Production, Preview, Development |
| `ADMIN_SEED_PASSWORD` | Your admin password | Production, Preview, Development |

---

## Step 5: Configure Build Settings

Vercel auto-detects Next.js, but verify these settings:

- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build` (already configured)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

---

## Step 6: Deploy!

1. Click **"Deploy"**
2. Wait for the build to complete (~2-5 minutes)
3. Vercel will provide a live URL (e.g., `https://your-app.vercel.app`)

---

## Step 7: Run Database Migrations

After deployment, you need to run Prisma migrations:

### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run migrations
vercel env pull .env.production.local
npx prisma migrate deploy
```

### Option B: Using Vercel Dashboard
1. Go to your project in Vercel dashboard
2. Click **"Settings" → "PostgreSQL"** (if using Vercel Postgres)
3. Use the built-in database UI to run migrations

### Option C: Add to Build Command
Update your build command in Vercel settings to:
```bash
npx prisma migrate deploy && npm run build
```

---

## Step 8: Seed Initial Admin User (Optional)

To create an admin user:

### Using Vercel CLI:
```bash
vercel env pull .env.production.local
npx prisma db seed
```

### Or manually via database client:
Connect to your PostgreSQL database and insert an admin user.

---

## Troubleshooting

### Build Fails with "Prisma Client not generated"
- Ensure `postinstall` script runs: `prisma generate`
- Check that `@prisma/client` is in dependencies

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- Check SSL mode in connection string (may need `?sslmode=require`)

### Socket.io Not Working
- Vercel Serverless Functions don't support WebSockets
- Consider using Vercel's Realtime SDK or external WebSocket service
- For now, messaging may fall back to polling

### Images Not Uploading
- Verify Cloudinary credentials
- Check Cloudinary upload presets

---

## Important Notes

⚠️ **WebSocket Limitation**: Vercel's serverless functions don't support persistent WebSocket connections. The Socket.io implementation will work in development but may not function properly in production on Vercel. Consider:
- Using Vercel's Realtime features
- Moving WebSocket to a separate service (Railway, Render, Fly.io)
- Implementing polling fallback

⚠️ **Database Migrations**: Always run `prisma migrate deploy` after deploying to production.

⚠️ **Environment Variables**: Never commit `.env` files to GitHub. Use Vercel's environment variable management.

---

## Alternative: Deploy to Render (Better for Full-Stack Apps)

If you need full WebSocket support and database included:

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Use the existing `render.yaml` configuration
5. Render includes PostgreSQL and supports WebSockets

See `render.yaml` in the repository for configuration.

---

## Testing Your Deployment

1. Visit your Vercel URL
2. Try registering a new account
3. Create a post
4. Test image uploads
5. Verify database operations

---

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/database/vercel)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
