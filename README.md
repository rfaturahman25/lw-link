# LW-link — Internal Linktree

Internal Linktree-like app buat Instagram bio. Simple, internal-only. Stack **Cloudflare Workers + D1 (SQLite)** — tanpa VPS, murah & gampang maintain.

## Features

- **Auth:** Username/email + password (SHA-256 `password_hash` di D1), session 24 jam (httpOnly `SameSite=Lax` + Bearer), RBAC `user`/`admin`
- **Profile:** Username unik, displayName/bio/team/company/theme, `published` gate (unpublished → 404)
- **Links:** CRUD, enable/disable, drag & drop reorder (`@dnd-kit`), icon picker (WA, IG, GSheet, dll)
- **Public:** `/:username` → `GET /api/public/:username` (published + active only), QR, SEO meta
- **Analytics:** `profile_view` + `link_click` (ip_hash, ua, referrer), dashboard dengan ranking, share donut, bar chart, time series 7 hari, unique visitors, CTR
- **Admin:** `GET /api/admin/users`, toggle status/role

## Stack

- Frontend: React 18 + Vite + Tailwind + React Router + React Query + lucide + qrcode.react
- Backend: Cloudflare Workers + Hono + Zod + Drizzle ORM
- DB: Cloudflare D1 (SQLite) — file `migrations/*.sql`
- Deploy: Wrangler

## Prasyarat

- Node >=20, npm >=9
- Akun Cloudflare (Free plan cukup)
- `npx wrangler login` untuk deploy remote

## 1. Local Development

```bash
npm install
cp .env.example .dev.vars  # isi SESSION_SECRET minimal 32 char

# DB lokal (Miniflare, file di .wrangler/state)
npm run db:migrate:local   # = wrangler d1 migrations apply lw-link-db --local
# seed: admin/admin123, rizki/rizki123

# Jalanin fullstack
npm run dev
# frontend http://localhost:5173  (vite, proxy /api → :8787)
# backend  http://localhost:8787  (wrangler dev --local)

# atau pisah:
npm run dev:frontend
npm run dev:backend
```

**Test login lokal:**

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"rizki","password":"rizki123"}'
# identifier bisa username atau email (rizki@example.local)

curl http://localhost:8787/health
curl http://localhost:8787/api/public/rizki
```

## 2. Build

```bash
npm run typecheck        # tsc --noEmit (frontend + backend)
npm run lint:check
npm test                 # vitest 16 tests

npm run build            # = build:frontend + build:backend
# build:frontend → vite build → dist/frontend/
# build:backend  → wrangler deploy --dry-run (cek <1MiB, sekarang ~390 KiB gzip 72 KiB)

npm run preview          # vite preview dist/frontend di :4173 (opsional)
```

## 3. Cloudflare D1 Setup

### D1 = SQLite di edge

- Local: Miniflare simulasikan D1, data di `.wrangler/state/v3/d1/`, direset dengan `rm -rf .wrangler`
- Remote: SQLite beneran di Cloudflare, di-bind via `wrangler.jsonc` → `d1_databases[0]`

**Buat DB remote (sekali saja):**

```bash
npx wrangler d1 create lw-link-db
# copy database_id yang keluar → paste ke wrangler.jsonc d1_databases[0].database_id
# contoh: "database_id": "xxxx-xxxx-xxxx"

# cek DB terdaftar
npx wrangler d1 list
```

**Migrasi:**

```bash
# lokal
npm run db:migrate:local
# atau
npx wrangler d1 migrations apply lw-link-db --local

# remote (produksi)
npm run db:migrate
# atau
npx wrangler d1 migrations apply lw-link-db --remote

# cek isi remote
npx wrangler d1 execute lw-link-db --remote --command "SELECT username, email FROM users;"
```

File migrasi ada di `migrations/`:
- `0001_initial_schema.sql` — users, profiles, links, analytics_events, sessions + seed admin/rizki
- `0002_add_password_hash.sql` — kolom `password_hash` + hash untuk seed

`drizzle.config.ts` pakai `dialect: sqlite, driver: d1` dan baca `wrangler.jsonc`.

## 4. Deploy ke Cloudflare Workers

### 4a. Config `wrangler.jsonc`

```jsonc
{
  "name": "lw-link",
  "main": "src/backend/index.ts",
  "compatibility_date": "2024-01-01",
  "routes": [{ "pattern": "links.example.com/*", "zone_name": "example.com" }],
  "vars": { "APP_NAME": "LW-link", "NODE_ENV": "production", "ALLOWED_ORIGINS": "https://links.example.com" },
  "d1_databases": [{ "binding": "DB", "database_name": "lw-link-db", "database_id": "<paste-remote-id>", "migrations_dir": "migrations" }],
  "observability": { "enabled": true }
}
```

Ganti `links.example.com` dengan domain kamu. Kalau belum punya domain custom, Worker tetap bisa diakses di `https://lw-link.<subdomain>.workers.dev` (hapus `routes` dulu).

### 4b. Secrets (jangan taruh di `vars`)

```bash
# wajib: minimal 32 char random
npx wrangler secret put SESSION_SECRET
# paste: openssl rand -base64 32

# opsional override ALLOWED_ORIGINS untuk prod
npx wrangler secret put ALLOWED_ORIGINS
# paste: https://links.example.com

npx wrangler secret list
```

`.dev.vars` hanya untuk lokal (`wrangler dev --local` baca file itu). Jangan commit.

### 4c. Deploy

```bash
# cek dulu tanpa deploy
npm run deploy:dry-run   # = wrangler deploy --dry-run

# deploy beneran
npm run deploy           # = wrangler deploy
# atau
npx wrangler deploy

# cek logs
npx wrangler tail
```

Setelah deploy, Worker akan serve:
- API di `https://<worker>.workers.dev/api/*` dan `https://links.example.com/api/*` (jika routes aktif)
- Frontend: karena Worker ini hanya API, frontend `dist/frontend` perlu dipublish terpisah — pilih salah satu:

**Opsi A — Frontend di Cloudflare Pages (recommended):**
```bash
npx wrangler pages deploy dist/frontend --project-name=lw-link-web
# set env di Pages: VITE_API_URL=https://links.example.com
```

**Opsi B — Frontend di Worker via Static Assets (jika pakai `assets` binding):**
Tambah di `wrangler.jsonc`:
```jsonc
"assets": { "directory": "dist/frontend", "not_found_handling": "single-page-application" }
```
Lalu `npm run build:frontend && npx wrangler deploy` akan serve SPA + API dari 1 Worker.

### 4d. DNS (jika pakai custom domain)

Cloudflare Dashboard → DNS → Add CNAME `links` → `lw-link.<subdomain>.workers.dev` (proxied orange cloud) atau biarkan Wrangler auto-create via `routes`.

## 5. Environment

| Var | Lokal (`.dev.vars`) | Prod (`wrangler secret` / `vars`) |
|-----|---------------------|-----------------------------------|
| `NODE_ENV` | `development` | `production` |
| `SESSION_SECRET` | dev random 32+ | `wrangler secret put` (wajib) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:8787` | `https://links.example.com` |
| `APP_NAME` | `LW-link` | `LW-link` |

Jangan commit `.dev.vars`.

## 6. API Ringkas

```
GET  /health, /health/ready
POST /api/auth/login  {identifier, password} -> {token, user} + Set-Cookie
POST /api/auth/logout
GET  /api/auth/session
GET  /api/me  PUT /api/me
GET  /api/profile  PUT /api/profile  PUT /api/profile/publish
GET  /api/links  POST /api/links  PUT /api/links/reorder  PUT /api/links/:id  PUT /api/links/:id/toggle  DELETE /api/links/:id
GET  /api/public/:username  POST /api/public/:username/view  POST /api/public/:username/click
GET  /api/analytics  -> {totalViews, totalClicks, uniqueVisitors, topLinks, daily[7]}
GET  /api/admin/users  PUT /api/admin/users/:id/status  PUT /api/admin/users/:id/role
```

Auth via `Authorization: Bearer <token>` atau `Cookie: session=<token>`.

## 7. Struktur

```
src/frontend/pages/{Home,auth/Login,dashboard/DashboardPage,public/PublicProfilePage}
src/backend/{api/{health,auth,me,profile,links,public,analytics,admin}, middleware/auth, db/{client,schema}, utils/security}
migrations/0001_*.sql  0002_add_password_hash.sql
wrangler.jsonc  drizzle.config.ts  vite.config.ts (proxy /api → :8787)
```

## 8. Catatan D1

- Free tier: 5GB storage, 5M reads/day, 100k writes/day — cukup untuk internal
- Backup: `npx wrangler d1 backup create lw-link-db` (atau export via `d1 execute --command "SELECT ..."` )
- Reset lokal: `rm -rf .wrangler && npm run db:migrate:local`

## Lisensi

MIT — internal use only
