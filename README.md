# AI Blogger Backend — Neon PostgreSQL

## Complete Project Structure
```
ai-blogger-backend/
├── migrations/
│   ├── 001_schema.sql   ← creates all database tables
│   ├── run.js           ← runs the SQL file against Neon
│   └── seed.js          ← adds admin + demo users + sample blogs
├── src/
│   ├── config/
│   │   └── database.js  ← Neon connection (query function)
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── blog.controller.js
│   │   ├── ai.controller.js
│   │   ├── user.controller.js
│   │   └── stats.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── blog.routes.js
│   │   ├── ai.routes.js
│   │   ├── user.routes.js
│   │   └── stats.routes.js
│   ├── services/
│   │   ├── ai.service.js
│   │   └── email.service.js
│   ├── utils/
│   │   ├── jwt.utils.js
│   │   ├── response.utils.js
│   │   └── plans.utils.js
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
└── package.json
```

## Setup Steps

### 1. Install packages
```bash
npm install
```

### 2. Create .env file
```bash
copy .env.example .env
```
Then open `.env` and fill in:
- `DATABASE_URL` — from neon.tech → your project → Connection Details → Connection string
- `JWT_SECRET` — any random string (min 32 chars)
- `JWT_REFRESH_SECRET` — another random string (min 32 chars)
- `ANTHROPIC_API_KEY` — from console.anthropic.com (optional, works without it)

### 3. Run database migrations
```bash
npm run migrate
```
Expected output:
```
🔄  Running migrations...
  → 001_schema.sql
  ✅  001_schema.sql done
✅  All tables created in Neon!
```

### 4. Seed demo data
```bash
npm run seed
```
Creates:
- `admin@aiblogger.io` / `Admin@1234`
- `demo@aiblogger.io` / `Demo@1234`
- 3 sample published blogs

### 5. Start the server
```bash
npm run dev
```
Expected output:
```
✅  Neon connected — 2026-...
🚀  Server running  →  http://localhost:5000
🏥  Health check   →  http://localhost:5000/api/v1/health
```

## Test in browser
Open: http://localhost:5000/api/v1/health

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/register | — | Register |
| POST | /api/v1/auth/login | — | Login |
| POST | /api/v1/auth/refresh | — | Refresh token |
| GET | /api/v1/auth/me | 🔒 | Current user |
| GET | /api/v1/blogs | — | Public blogs |
| GET | /api/v1/blogs/mine | 🔒 | My blogs |
| POST | /api/v1/blogs | 🔒 | Create blog |
| PUT | /api/v1/blogs/:id | 🔒 | Update blog |
| PATCH | /api/v1/blogs/:id/publish | 🔒 | Publish/unpublish |
| DELETE | /api/v1/blogs/:id | 🔒 | Delete blog |
| POST | /api/v1/ai/generate | 🔒 | Generate AI blog |
| GET | /api/v1/ai/trending | 🔒 | Trending keywords |
| POST | /api/v1/ai/chat | 🔒 | Chatbot |
| GET | /api/v1/stats/public | — | Platform stats |
| GET | /api/v1/stats/me | 🔒 | My stats |

## Connect Frontend
Add to your login.html before </body>:
```html
<script src="js/api.js"></script>
<script src="js/login-connect.js"></script>
```

Add to your index.html before </body>:
```html
<script src="js/api.js"></script>
<script src="js/landing-connect.js"></script>
```
