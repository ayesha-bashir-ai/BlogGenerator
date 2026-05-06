# AI Blogger

An AI-powered blog generation platform where users enter a topic, fetch related trending keywords, and generate SEO-optimized blog posts.

## Run & Operate

| Service | Command | Port |
|---------|---------|------|
| Frontend (Vite) | `cd frontend && npm run dev` | 5000 |
| Backend (Express) | `cd ai-blogger-backend && node src/server.js` | 3000 |

Required env vars (in `ai-blogger-backend/.env`):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — secret for signing JWTs
- `ANTHROPIC_API_KEY` — Claude AI for blog generation
- `SERPAPI_KEY` — (optional) SerpAPI for Google Trends (falls back gracefully)

## Stack

- **Frontend**: Plain HTML + vanilla JS, served by Vite 8
- **Backend**: Node.js + Express (CommonJS), port 3000
- **Database**: Neon PostgreSQL via `@neondatabase/serverless`
- **AI**: Anthropic Claude (via `ANTHROPIC_API_KEY`)
- **Trends**: `google-trends-api` npm package with smart fallback
- **Auth**: JWT (`jsonwebtoken` + `bcryptjs`)
- **Package manager**: npm

## Where things live

- `frontend/` — all HTML pages, `js/auth.js` (shared auth client), `vite.config.js`
- `ai-blogger-backend/src/` — Express app, routes, controllers, services
- `ai-blogger-backend/migrations/` — SQL schema + runner (`npm run migrate`)
- `ai-blogger-backend/src/routes/trends.routes.js` — Google Trends keyword fetch
- `ai-blogger-backend/src/services/ai.service.js` — blog generation logic

## Architecture decisions

- Frontend is plain HTML/JS (not React) served by Vite as a static file server with a proxy to the backend API on port 3000
- `google-trends-api` attempts real Google Trends lookups first; falls back to curated smart keyword pools per topic category when Google blocks server-side requests
- Backend uses raw SQL migrations (not Prisma ORM) despite a `prisma/schema.prisma` file being present — the Prisma file is unused
- CORS is configured to allow all origins in development (`FRONTEND_URL` env var locks it down in production)

## Product

- Landing page (`index.html`) with hero, pricing, testimonials, FAQ
- Blog generator (`generate.html`): enter topic → fetch trending related keywords via Google Trends → configure settings (tone, length, SEO) → generate full blog post
- Dashboard (`dashboard.html`): manage generated blogs
- Auth (`login.html`): register/login with JWT tokens; `js/auth.js` handles all pages

## User preferences

_Populate as preferences are expressed._

## Gotchas

- Backend must run on port **3000**; frontend Vite dev server must run on port **5000**
- `google-trends-api` often gets blocked by Google in server environments — the fallback keyword pools are the normal production path
- The Neon DB connection at startup will fail silently (shows epoch date) if `DATABASE_URL` is missing or invalid
- `js/auth.js` uses `window.AI_BLOGGER_API` — set this before the script runs in each HTML page

## Pointers

- Trends route: `ai-blogger-backend/src/routes/trends.routes.js`
- Auth middleware: `ai-blogger-backend/src/middleware/auth.middleware.js`
- DB schema: `ai-blogger-backend/migrations/001_schema.sql`
