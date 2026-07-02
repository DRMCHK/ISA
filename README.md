# ISA Link — International Student Association

**Empowered To Succeed**

A professional social media platform built for international student associations. Supports 200+ concurrent users with real-time updates, content moderation, admin controls, and anonymous reporting.

## Features

- **Social Feed** — Post text, photos, videos, and links
- **User Profiles** — Custom profile pictures and bios
- **Permissions System** — Admin controls who can post media and links
- **Content Moderation** — Automated filtering for inappropriate content and suspicious links
- **Anonymous Reports** — Users can submit reports, suggestions, and advice anonymously
- **Admin Panel** — Manage users, moderate content, review reports
- **Light/Dark Mode** — Toggle between themes
- **Real-time** — Live feed updates and online user count via WebSocket

## Prerequisites
- Node.js 18+ installed
- **XAMPP** with MySQL running (Apache optional for this app)

### Database
The app uses MySQL via XAMPP. Default credentials in `.env`:
- Host: `localhost`
- User: `root`
- Password: *(empty)*
- Database: `isa_link` *(created automatically)*

Start **MySQL** in the XAMPP Control Panel before running the app.

```bash
cd c:\xampp\ISA
npm run setup
```

### Run Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Default Admin Account

| Field    | Value              |
|----------|--------------------|
| Email    | admin@isalink.org  |
| Password | Admin@ISA2026!     |

Change these in `.env` before deploying to production.

## Production Build

```bash
npm run build
npm start
```

The server serves the built frontend from `client/dist`.

## Architecture

```
ISA/
├── server/           # Express + Socket.io backend
│   ├── db/           # MySQL database setup
│   ├── routes/       # API endpoints
│   ├── services/     # Content moderation engine
│   └── middleware/   # Auth & file upload
├── client/           # React + Vite frontend
├── uploads/          # User media storage
```

## Security Notes

- Change `JWT_SECRET` and admin credentials in `.env` for production
- Content moderation uses keyword filtering and URL analysis
- Rate limiting enabled (500 requests per 15 minutes)
- Helmet security headers enabled

## License

Built for the International Student Association.
