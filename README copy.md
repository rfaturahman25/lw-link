# LW-link — Internal Linktree

Self-hosted, internal Linktree-like application. Simple, fast, secure, easy to maintain. Built on **Cloudflare Workers + D1** (free tier). No VPS, no Redis, no K8s.

## Features (MVP done)

- **Auth:** D1 sessions (httpOnly `SameSite=Lax` + Bearer), SHA-256 hashed tokens, 24h TTL, RBAC `user`/`admin`, IDOR protection (all mutations scoped by `userId`)
- **Profile:** Username unique, displayName/avatar/bio/team/company/theme (default/light/dark/minimal/gradient), `published` gate — unpublished → 404
- **Links:** CRUD, enable/disable, reorder (`PUT /reorder`), URL validation (only `http://`/`https://`, blocks `javascript:`/`data:`), drag-free up/down reorder
- **Public profile:** `GET /@username` + `GET /api/public/:username` (published + active only), mobile-first, QR via `qrcode.react`, SEO title + meta + OG populated client-side
- **Analytics:** `profile_view` + `link_click` events (ip hash, ua, referrer, country), `GET /api/analytics` → totalViews/clicks, topLinks, daily 7d
- **Admin:** `GET /api/admin/users`, `PUT /status`/`PUT /role`, list profiles, publish/unpublish
- **Hardening:** Secure cookies, CORS (allowlist via `ALLOWED_ORIGINS`), CSP/HSTS/X-Frame/CSRF headers, `X-Request-Id`, rate-limit 120 req/min per IP, structured JSON logs (no secrets), Zod validation

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + React Router + React Query + lucide-react + qrcode.react
- **Backend:** Cloudflare Workers + Hono.js + Zod + Drizzle ORM
- **DB:** Cloudflare D1 (SQLite)
- **Deploy:** Wrangler + GitHub Actions

## Requirements

- Node.js >=20 (LTS) — tested on v26.5
- npm >=9
- Cloudflare account (Free plan OK)

## Local Development

```bash
npm install
npm run db:migrate:local
npm run dev
# frontend http://localhost:5173  backend http://localhost:8787 (wrangler dev --local)
# or separately: npm run dev:frontend / npm run dev:backend
```

**Test users (dev, no password):** `rizki@example.local` (user), `admin@example.local` (admin)

```bash
# manual auth
curl -X POST http://localhost:8787/api/auth/login -H "Content-Type: application/json" -d '{"email":"rizki@example.local"}'
# uses cookie + Bearer token; stored in localStorage as session_token for frontend

# health
curl http://localhost:8787/health
curl http://localhost:8787/health/ready
curl http://localhost:8787/api/public/rizki
```

**Quality gates (all pass):**

```bash
npm run typecheck # tsc --noEmit
npm run lint:check
npm run test      # 16 tests (health, security, authz)
npm run build     # vite + wrangler --dry-run (385 KiB < 1 MiB limit)
```

**Verify E2E (example, uses local D1):**

```bash
npx wrangler dev --port 8787 --local &
TOKEN=$(curl -s -X POST http://localhost:8787/api/auth/login -H "Content-Type: application/json" -d '{"email":"rizki@example.local"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/me
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/public/rizki
```

## Project Structure

```
lw-link/
├── src/
│   ├── frontend/  # React (pages: Home, Login, Dashboard, PublicProfile, 404; hooks/useAuth, services/api)
│   ├── backend/   # Worker (api: health/auth/me/profile/links/public/analytics/admin, middleware: auth/rateLimit/logging/error, utils: security/validation)
│   └── shared/    # types
├── migrations/0001_initial_schema.sql  # users, profiles, links, analytics_events, sessions + indexes + seed
├── public/ (favicon.svg, robots.txt)
├── tests/unit/{health,security,authz}.test.ts
├── wrangler.jsonc (DB lw-link-db, routes links.example.com/*)
├── vite.config.ts (proxy /api, /health to :8787)
└── drizzle.config.ts
```

## Environment

- `.dev.vars` (gitignored, used by `wrangler dev --local`): `NODE_ENV=development`, `ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8787`, `SESSION_SECRET` (min 32 chars)
- `.env.example` documents required vars; never commit secrets
- Secrets for deploy via `wrangler secret put SESSION_SECRET` and GitHub Secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`

## Cloudflare Setup (when approved — do NOT run until explicitly approved)

```bash
npx wrangler login
npx wrangler d1 create lw-link-db  # copy database_id into wrangler.jsonc
npm run db:migrate  # or wrangler d1 migrations apply lw-link-db --remote
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ALLOWED_ORIGINS  # e.g. https://links.example.com
npm run deploy  # or push to main → GitHub Actions (test → build → deploy)
# DNS: links.example.com CNAME → workers.dev (via Cloudflare DNS)
```

GitHub Actions `.github/workflows/deploy.yml`: on `push: main` → `lint → typecheck → test → build` → `wrangler deploy` (needs secrets). No deploy on PR.

## API Overview

```
GET  /health, /health/ready, /health/version
POST /api/auth/login  {email} -> {token, user} + Set-Cookie
POST /api/auth/logout
GET  /api/auth/session
GET  /api/me  (auth)
PUT  /api/me  {username, displayName, avatarUrl}
GET  /api/profile  (auth)
PUT  /api/profile  {bio, team, company, theme, ...}
PUT  /api/profile/publish  {published}
GET  /api/links  (auth, ordered)
POST /api/links  {title, url, icon}
PUT  /api/links/reorder  {orderedIds}
PUT  /api/links/:id  {title, url, ...}
PUT  /api/links/:id/toggle
DELETE /api/links/:id
GET  /api/public/:username  (public, 404 if unpublished/disabled)
POST /api/public/:username/view
POST /api/public/:username/click {linkId}
GET  /api/analytics  (auth)
GET  /api/admin/users?q=  (admin)
PUT  /api/admin/users/:id/status {status}
PUT  /api/admin/users/:id/role {role}
```

All auth routes check `Authorization: Bearer <token>` or `Cookie: session=<token>` and validate via `validateSession` (D1, expiry, disabled user).

## Security Model

- No passwords stored; dev auth gated by `NODE_ENV=development` and `@example.local`
- Sessions: random token → SHA-256 hash in DB, httpOnly cookie, SameSite=Lax, Secure in prod, 24h expiry
- RBAC via `requireRole('admin')`, ownership checks (`eq(links.userId, user.id)`)
- Zod validation for all inputs, URL whitelist, SQL injection via Drizzle param queries
- Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` in prod, `CSP`, `X-Request-Id`, `X-RateLimit-*`
- Logging: structured JSON with requestId, method, path, status, duration; never logs tokens/passwords
- Analytics: ip hashed (SHA-256 truncated), minimal PII

## Accessibility & Performance

- Semantic HTML, label ↔ input, keyboard navigable, focus rings, contrast via Tailwind
- Public profile fastest: minimal JS, no heavy theme editor, QR via SVG, lazy not needed
- Frontend code-split (vendor/ui/utils), gzip ~50kB

## Deployment Notes

- `main` is prod branch; `feature/*` for work
- Free tier: Workers (100k req/day), D1 (5 GB, 5M reads/day) — sufficient for internal use
- Observability: `GET /health` + `GET /ready` + `GET /version`

## License

MIT — Internal use only
