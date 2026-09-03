# LW-link — Internal Linktree

Internal Linktree-like application for Instagram bio. Simple, internal-only. Stack **Cloudflare Workers + D1 (SQLite)** — no VPS, cheap and easy to maintain.

## Features

- **Auth:** Username/email + password (SHA-256 `password_hash` in D1), 24-hour session (httpOnly `SameSite=Lax` + Bearer), RBAC `super_admin`/`admin`/`user`
- **Profile:** Unique username, displayName/bio/team/company/theme, `published` gate (unpublished → 404)
- **Links:** CRUD, enable/disable, drag & drop reorder (`@dnd-kit`), icon picker (WA, IG, GSheet, etc.), sections/categories
- **Public:** `/:username` → `GET /api/public/:username` (published + active only), QR, SEO meta, sections grouping
- **Analytics:** `profile_view` + `link_click` (ip_hash, ua, referrer), dashboard with ranking, share donut, bar chart, 7-day time series, unique visitors, CTR
- **Admin:** `GET /api/admin/users`, `POST /api/admin/users`, `PUT /api/admin/users/:id/status|role`, `DELETE /api/admin/users/:id`, `GET /api/admin/audit-logs`
- **Sections:** Group links into sections (e.g. Social Media, Projects), reorder sections/links, `No Section` fallback

## Stack

- Frontend: React 18 + Vite + Tailwind + React Router + React Query + lucide + qrcode.react
- Backend: Cloudflare Workers + Hono + Zod + Drizzle ORM
- DB: Cloudflare D1 (SQLite) — files `migrations/*.sql`
- Deploy: Wrangler

## Requirements

- Node >=20, npm >=9
- Cloudflare account (Free plan is enough)
- `npx wrangler login` for remote deploy

## 1. Local Development

```bash
npm install
cp .env.example .dev.vars  # fill SESSION_SECRET with at least 32 chars

# Local DB (Miniflare, files in .wrangler/state)
npm run db:migrate:local   # = wrangler d1 migrations apply lw-link-db --local
# seed: admin@lensawaktu.id / lensawaktu124 (super_admin), plus test users if any

# Run fullstack
npm run dev
# frontend http://localhost:5173  (vite, proxy /api → :8787)
# backend  http://localhost:8787  (wrangler dev --local)

# or separately:
npm run dev:frontend
npm run dev:backend
```

**Test login locally:**

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@lensawaktu.id","password":"lensawaktu124"}'
# identifier can be username or email

curl http://localhost:8787/health
curl http://localhost:8787/api/public/lensawaktu
```

## 2. Build

```bash
npm run typecheck        # tsc --noEmit (frontend + backend)
npm run lint:check
npm test                 # vitest 16 tests

npm run build            # = build:frontend + build:backend
# build:frontend → vite build → dist/frontend/
# build:backend  → wrangler deploy --dry-run (check <1MiB, now ~400 KiB gzip 75 KiB)

npm run preview          # vite preview dist/frontend on :4173 (optional)
```

## 3. Cloudflare D1 Setup

### D1 = SQLite at the edge

- Local: Miniflare simulates D1, data in `.wrangler/state/v3/d1/`, reset with `rm -rf .wrangler`
- Remote: Real SQLite on Cloudflare, bound via `wrangler.jsonc` → `d1_databases[0]`

**Create remote DB (once):**

```bash
npx wrangler d1 create lw-link-db
# copy the database_id from output → paste into wrangler.jsonc d1_databases[0].database_id
# example: "database_id": "xxxx-xxxx-xxxx"

# check registered DBs
npx wrangler d1 list
```

**Migrations:**

```bash
# local
npm run db:migrate:local
# or
npx wrangler d1 migrations apply lw-link-db --local

# remote (production)
npm run db:migrate
# or
npx wrangler d1 migrations apply lw-link-db --remote

# inspect remote data
npx wrangler d1 execute lw-link-db --remote --command "SELECT username, email, role FROM users;"
```

Migration files in `migrations/`:
- `0001_initial_schema.sql` — users, profiles, links, analytics_events, sessions + seed
- `0002_add_password_hash.sql` — `password_hash` column + hashes for seed users
- `0003_rbac_super_admin.sql` — `super_admin` role, `last_login_at`, `audit_logs`
- `0004_add_sections.sql` — `sections` table + `links.section_id`

`drizzle.config.ts` uses `dialect: sqlite, driver: d1` and reads `wrangler.jsonc`.

## 4. Deploy to Cloudflare Workers

### 4a. Config `wrangler.jsonc`

```jsonc
{
  "name": "lw-link",
  "main": "src/backend/index.ts",
  "compatibility_date": "2024-01-01",
  "routes": [{ "pattern": "links.example.com/*", "zone_name": "example.com" }],
  "assets": { "directory": "dist/frontend", "binding": "ASSETS", "not_found_handling": "single-page-application" },
  "vars": { "APP_NAME": "LW-link", "NODE_ENV": "production", "ALLOWED_ORIGINS": "https://links.example.com" },
  "d1_databases": [{ "binding": "DB", "database_name": "lw-link-db", "database_id": "<paste-remote-id>", "migrations_dir": "migrations" }],
  "observability": { "enabled": true }
}
```

Replace `links.example.com` with your domain. If you don't have a custom domain yet, the Worker will still be available at `https://lw-link.<subdomain>.workers.dev` (remove `routes` first).

### 4b. Secrets (do not put in `vars`)

```bash
# required: at least 32 random chars
npx wrangler secret put SESSION_SECRET
# paste: openssl rand -base64 32

# optional override ALLOWED_ORIGINS for prod
npx wrangler secret put ALLOWED_ORIGINS
# paste: https://links.example.com

npx wrangler secret list
```

`.dev.vars` is only for local (`wrangler dev --local` reads it). Do not commit.

### 4c. Deploy

```bash
# dry-run check first
npm run deploy:dry-run   # = wrangler deploy --dry-run

# real deploy
npm run deploy           # = wrangler deploy
# or
npx wrangler deploy

# check logs
npx wrangler tail
```

After deploy, the Worker serves:
- API at `https://<worker>.workers.dev/api/*` and `https://links.example.com/api/*` (if routes are active)
- Frontend: `dist/frontend` is served via Workers Static Assets (SPA fallback handles `/@username`, `/dashboard/*`, etc.)

**Frontend via Workers Static Assets (current setup):**
Already configured in `wrangler.jsonc`:
```jsonc
"assets": { "directory": "dist/frontend", "binding": "ASSETS", "not_found_handling": "single-page-application" }
```
Then `npm run build:frontend && npx wrangler deploy` serves SPA + API from a single Worker.

**Alternative — Frontend on Cloudflare Pages:**
```bash
npx wrangler pages deploy dist/frontend --project-name=lw-link-web
# set env in Pages: VITE_API_URL=https://links.example.com
```

### 4d. DNS (if using custom domain)

Cloudflare Dashboard → DNS → Add CNAME `links` → `lw-link.<subdomain>.workers.dev` (proxied, orange cloud) or let Wrangler auto-create via `routes`.

## 5. Environment

| Var | Local (`.dev.vars`) | Prod (`wrangler secret` / `vars`) |
|-----|---------------------|-----------------------------------|
| `NODE_ENV` | `development` | `production` |
| `SESSION_SECRET` | dev random 32+ | `wrangler secret put` (required) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:8787` | `https://links.example.com` |
| `APP_NAME` | `LW-link` | `LW-link` |

Do not commit `.dev.vars`.

## 6. API Overview

```
GET  /health, /health/ready
POST /api/auth/login  {identifier, password} -> {token, user} + Set-Cookie
POST /api/auth/logout
GET  /api/auth/session
GET  /api/me  PUT /api/me  {username, displayName, avatarUrl}
GET  /api/profile  PUT /api/profile  {bio, team, company, theme, ...}  PUT /api/profile/publish  {published}
GET  /api/links  POST /api/links  {title, url, icon, sectionId}  PUT /api/links/reorder  {orderedIds}  PUT /api/links/:id  {title, url, icon, sectionId}  PUT /api/links/:id/toggle  DELETE /api/links/:id
GET  /api/sections  POST /api/sections  {title}  PUT /api/sections/:id  {title}  DELETE /api/sections/:id  PUT /api/sections/reorder  {orderedIds}
GET  /api/public/:username  POST /api/public/:username/view  POST /api/public/:username/click  {linkId}
GET  /api/analytics  -> {totalViews, totalClicks, uniqueVisitors, topLinks, daily[7]}
GET  /api/admin/users?q=&role=&status=  POST /api/admin/users  PUT /api/admin/users/:id/status  PUT /api/admin/users/:id/role  DELETE /api/admin/users/:id
GET  /api/admin/audit-logs
```

Auth via `Authorization: Bearer <token>` or `Cookie: session=<token>`. All admin routes are RBAC-protected (server-side). Public routes (`/@username` via `GET /api/public/:username`) handle `@` and `%40` canonicalization (`/%40username` → `301` → `/@username`).

## 7. Project Structure

```
src/frontend/pages/{auth/Login, dashboard/{DashboardLayout,Overview,Profile,Links,Analytics,Users,AuditLogs}, public/PublicProfilePage}
src/backend/{api/{health,auth,me,profile,links,sections,public,analytics,admin}, middleware/{auth,rbac}, db/{client,schema}, utils/{security,validation}, services/{auth,audit}}
migrations/0001_*.sql .. 0004_add_sections.sql
wrangler.jsonc  drizzle.config.ts  vite.config.ts (proxy /api → :8787)
```

## 8. D1 Notes

- Free tier: 5GB storage, 5M reads/day, 100k writes/day — enough for internal use
- Backup: `npx wrangler d1 backup create lw-link-db` (or export via `d1 execute --command "SELECT ..."` )
- Reset local: `rm -rf .wrangler && npm run db:migrate:local`
- Sections: existing links get `section_id = null` (shown as “No Section”), safe for existing users

## License

MIT — internal use only
