# Repository Guidelines

## Project Overview

LW-link is an existing, production-oriented Lensawaktu link-in-bio platform. It runs as a React/Vite frontend and Cloudflare Worker (Hono), with Cloudflare D1/SQLite storage and GitHub Actions deployment. Authentication, IAM/RBAC, profiles, links, click tracking, analytics, APIs, and business rules are established functionality. Preserve them: the main development priority is a polished, responsive frontend UI/UX.

The authenticated experience is a full-screen **Visual Profile Builder** (live canvas + floating settings panel + floating toolbar, with a full-width Links workspace). The public profile is rendered by the shared `PublicProfileView`, so the builder preview and the live page never drift.

Do not treat this as a new Linktree clone or rewrite working architecture. Inspect first and make the smallest change that satisfies the request.

## Project Structure & Module Organization

- `src/frontend/` contains React pages, components, hooks, services, utilities, and global styles.
  - `components/builder/` — Visual Builder shell (`VisualBuilder`), canvas (`BuilderCanvas`), settings panel (`BuilderSettingsPanel`), toolbar (`BuilderToolbar`), panels (`ThemePanel`, `ContentPanel`), shared controls (`controls.tsx`, `ImageUploadField.tsx`, `types.ts`), and the retained-but-hidden `SeoPanel`.
  - `components/links/` — full links workspace (`LinksManager`), shared Add/Edit form (`LinkForm` + `linkFormModel.ts`), and drag collision helpers (`dndCollision.ts`).
  - `components/ui/Modal.tsx` — reusable accessible dialog (no external dependency).
  - `components/profile/` — `PublicProfileView` and its parts (`IdentityHeader`, `Avatar`, `SocialRow`, `LinkCard`, `FeaturedLink`, `ShareCard`, `linkIcons`).
  - `themes/` — theme presets, fonts, and the resolver that maps `theme_config` → `--pp-*` CSS variables.
  - `hooks/useProfileDraft.ts` (builder draft + save), `hooks/useMediaQuery.ts`.
- `src/backend/` contains Worker routes (`api/`), middleware, services, database access, and server utilities (`utils/seo.ts` for server-rendered profile meta).
- `src/shared/types/` holds cross-application types; `migrations/` contains ordered D1 migrations; `tests/` holds Vitest tests; `public/` holds static assets (`robots.txt`).
- Keep new migrations forward-only and named in sequence, for example `0013_add_feature.sql`. Never alter an applied migration.

## Development Commands

- `npm run dev` starts Vite (5173) and the local Worker (8787).
- `npm run db:migrate:local` applies migrations to the local D1 database.
- `npm test`, `npm run typecheck`, and `npm run lint:check` run the expected checks.
- `npm run build` builds the frontend and performs a Worker deployment dry run.

Use `npm run lint` or `npm run format` only when you intend to apply automatic edits. Do not run `wrangler deploy` or modify deployment infrastructure unless explicitly requested.

## UI/UX Direction

Prioritize a modern, minimal, premium, fast, lightweight, mobile-first experience.

The public profile follows the **Linktree-style reference**: a centered, single-column bio page.
On mobile it is edge-to-edge; on desktop the whole profile sits inside **one** container card
(rounded corners, subtle themed border, soft shadow, translucent surface) floating on the themed
background. Inside the card the composition stays deliberately simple, in this order:

- **Identity** — logo/avatar, display name, short bio, then a plain row of social icons
  (icon-only, no per-icon chrome).
- **Featured tile** — optional promoted link with a thumbnail.
- **Sections** — short, uppercase, letter-spaced, centered labels. Links that belong to no
  section are rendered without any label (never invent a "Links" heading).
- **Link rows** — rounded cards with a leading icon, a centered title that follows the row's
  text alignment, an optional location subtitle (pin + address), and an optional bold title.
  Do not add trailing affordance icons (external-link arrows, menus) to the public view.
- **Share/QR block**, then a subtle `© {year} Lensawaktu. All rights reserved.` footer.

Every visual value comes from `--pp-*` CSS variables produced by the theme resolver — never
hardcode colors, radii, or shadows in components. Do not add page-level navigation, multi-column
layouts, or extra nested card-in-card structures beyond the single desktop container card.

Authenticated surfaces (dashboard + builder) use a modern-minimal system with the brand teal as the single accent. The legacy `retro.*` Tailwind colors are accents only — do not reintroduce them as the dashboard base palette.

The builder must render its canvas through the real `PublicProfileView` (`interactive={false}`) so the preview and the public page cannot drift, and it must never emit analytics. Keep builder interactions local (draft state) and persist only on Save. Because the desktop container card is part of `PublicProfileView`, the builder's desktop/website preview gets it for free — do not add a preview-only wrapper.

Verify significant UI work at mobile, tablet, and desktop sizes. Do not introduce horizontal scrolling; keep links and buttons comfortably tappable. Reuse or extend existing components before creating new abstractions, preserve component APIs where practical, and trace visual issues to their source rather than layering CSS overrides. Avoid `!important`, duplicate/conflicting CSS, excessive animation, and unexplained magic numbers. Animate transitions (menu/tab, mode, device, panel, toast, dialog, share reveal) via the existing `anim-*`/`sheet-in`/`toast-in`/`modal-*`/`form-reveal` classes and always respect `prefers-reduced-motion`.

## Visual Builder, Themes & SEO

- **Routes:** `/dashboard/profile` and `/dashboard/builder` open the builder in Design mode; `/dashboard/links` opens the same builder in Links mode (the old standalone Links page was removed). Keep those routes working.
- **Draft/save:** `useProfileDraft` owns the draft and dirty state and reuses the existing `profilePut`/`profileSocialsPut`/`profilePublish` calls. Do not autosave.
- **Theme system:** `theme_config` (JSON in `profiles.theme_config`) is the single source of truth. New options (`typeScale`, `avatarSize`, `avatarRing`, `backgroundColor`, `sectionOrder`, `seoTitle`, `seoDescription`) must stay optional and backward compatible — extend the resolver and the Zod schema, do not add a migration for them. The resolver is the only place that maps theme → `--pp-*` CSS variables. Overrides are validated on read (`sanitizeOverrides`), so retiring a font, theme, or option never breaks a saved config — retired theme ids are mapped through `LEGACY_PALETTE_MAP`.
- **Links:** reuse the shared `LinkForm`/`linkFormModel` for Add and Edit, and the existing links/sections APIs. Section/link drag ordering uses the type-scoped `dndCollision` helper (`selectDroppables`, `resolveTargetSection`). The unsectioned group is a first-class sortable container, ordered via `theme_config.sectionOrder` using the `UNSECTIONED_GROUP` sentinel.
- **SEO:** the public page is a client-rendered SPA, so per-profile `<title>`/description/OG tags are injected server-side in the Worker (`utils/seo.ts`) for `/@username`; `/sitemap.xml` is dynamic and `robots.txt` is static. Non-profile routes are served the app shell with `X-Robots-Tag: noindex`. Do not break the `/%40username` → `/@username` redirect or the SPA fallback.

## Preserve Existing Behavior

For UI tasks, prefer frontend-only changes. Do not alter API contracts, Worker routes/bindings, D1 schema/queries, auth/session behavior, IAM permissions, analytics, routing, state management, validation, real API calls, or data models unless the request explicitly requires it.

Never replace live integrations with mocks or hardcoded frontend data. Preserve analytics event names, payloads, and exactly-once behavior; inspect the implementation when a changed component tracks events. If a backend, auth, or database change is genuinely necessary, identify the affected code and data flow, explain why frontend-only work is insufficient, and propose the smallest safe change before implementation.

## D1, Workers & Deployment Safety

Treat database and production configuration changes as high-impact. Before a migration, inspect the schema and existing migrations, identify affected tables and queries, preserve backward compatibility, and create a new migration. Never reset D1, change applied migrations, seed or alter production data, or make destructive changes without explicit confirmation.

Keep Cloudflare Workers, D1, Wrangler configuration, and `.github/workflows/` unchanged for UI-only work. The normal production path is commit and push to `main`, then GitHub Actions builds, tests, and deploys. Do not bypass it with manual deployment. Before modifying CI/CD, inspect the workflow, preserve its secrets/deployment flow, validate YAML, explain the impact, and scope the edit narrowly.

## Code Style & Tests

Use TypeScript, two-space indentation, single quotes, no semicolons, and focused named exports/functions, matching existing code. Components and pages use `PascalCase` filenames (for example, `BuilderPage.tsx`, `LinksManager.tsx`); hooks use `useSomething.ts`; server utilities use camelCase. Use `@frontend`, `@backend`, and `@shared` aliases where helpful. ESLint warns on `any` and unused values; prefix deliberately unused parameters with `_`.

Vitest uses jsdom and `tests/setup.ts`. Name tests `*.test.ts(x)` or `*.spec.ts(x)` in `tests/` or alongside their source. Add focused coverage for changed authorization, validation, API, theme resolution, builder draft/save, dialog, public-profile, or SEO behavior. Run proportionate tests plus typecheck before handoff.

## Git, Secrets & Review

Before non-trivial work, inspect relevant code and `git status`; after changes, review `git diff` for unintended edits. Do not overwrite unrelated user changes, reset/discard work, commit, push, or deploy unless explicitly asked. Keep commits small and imperative, following history such as `feat(theme): add palette controls` or `fix(profile): handle invalid updates`. PRs should state impact, migrations/configuration, relevant issue, checks run, and frontend screenshots where useful.

Never commit or expose `.dev.vars`, `.wrangler/`, credentials, tokens, API keys, session secrets, Cloudflare/GitHub secrets, or private environment variables. Check whether a new variable is server-only before use; browser code must never receive server secrets. Remove debugging code introduced by your changes.

## Working Principle

Preserve functionality, data flow, analytics, authentication, APIs, D1, and CI/CD. Improve presentation and usability. Diagnose root cause before fixing; when scope is unclear, inspect first and change less.
