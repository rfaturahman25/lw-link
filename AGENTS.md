# Repository Guidelines

## Project Overview

LW-link is an existing, production-oriented Lensawaktu link-in-bio platform. It runs as a React/Vite frontend and Cloudflare Worker (Hono), with Cloudflare D1/SQLite storage and GitHub Actions deployment. Authentication, IAM/RBAC, profiles, links, click tracking, analytics, APIs, and business rules are established functionality. Preserve them: the main development priority is a polished, responsive frontend UI/UX.

Do not treat this as a new Linktree clone or rewrite working architecture. Inspect first and make the smallest change that satisfies the request.

## Project Structure & Module Organization

- `src/frontend/` contains React pages, components, hooks, services, utilities, and global styles.
- `src/backend/` contains Worker routes (`api/`), middleware, services, database access, and server utilities.
- `src/shared/types/` holds cross-application types; `migrations/` contains ordered D1 migrations; `tests/` holds Vitest tests; `public/` holds static assets.
- Keep new migrations forward-only and named in sequence, for example `0006_add_feature.sql`. Never alter an applied migration.

## Development Commands

- `npm run dev` starts Vite (5173) and the local Worker (8787).
- `npm run db:migrate:local` applies migrations to the local D1 database.
- `npm test`, `npm run typecheck`, and `npm run lint:check` run the expected checks.
- `npm run build` builds the frontend and performs a Worker deployment dry run.

Use `npm run lint` or `npm run format` only when you intend to apply automatic edits. Do not run `wrangler deploy` or modify deployment infrastructure unless explicitly requested.

## UI/UX Direction

Prioritize a modern, minimal, premium, fast, lightweight, mobile-first experience. The public profile is a dedicated link-in-bio page, not an admin dashboard: avoid unnecessary navigation, headers/footers, outer borders, nested containers, cards, shadows, decorative elements, gradients, and fixed-width layouts. Keep its visual identity coherent with the existing design.

Verify significant UI work at mobile, tablet, and desktop sizes. Do not introduce horizontal scrolling; keep links and buttons comfortably tappable. Reuse or extend existing components before creating new abstractions, preserve component APIs where practical, and trace visual issues to their source rather than layering CSS overrides. Avoid `!important`, duplicate/conflicting CSS, excessive animation, and unexplained magic numbers.

## Preserve Existing Behavior

For UI tasks, prefer frontend-only changes. Do not alter API contracts, Worker routes/bindings, D1 schema/queries, auth/session behavior, IAM permissions, analytics, routing, state management, validation, real API calls, or data models unless the request explicitly requires it.

Never replace live integrations with mocks or hardcoded frontend data. Preserve analytics event names, payloads, and exactly-once behavior; inspect the implementation when a changed component tracks events. If a backend, auth, or database change is genuinely necessary, identify the affected code and data flow, explain why frontend-only work is insufficient, and propose the smallest safe change before implementation.

## D1, Workers & Deployment Safety

Treat database and production configuration changes as high-impact. Before a migration, inspect the schema and existing migrations, identify affected tables and queries, preserve backward compatibility, and create a new migration. Never reset D1, change applied migrations, seed or alter production data, or make destructive changes without explicit confirmation.

Keep Cloudflare Workers, D1, Wrangler configuration, and `.github/workflows/` unchanged for UI-only work. The normal production path is commit and push to `main`, then GitHub Actions builds, tests, and deploys. Do not bypass it with manual deployment. Before modifying CI/CD, inspect the workflow, preserve its secrets/deployment flow, validate YAML, explain the impact, and scope the edit narrowly.

## Code Style & Tests

Use TypeScript, two-space indentation, single quotes, no semicolons, and focused named exports/functions, matching existing code. Components and pages use `PascalCase` filenames (for example, `LinksPage.tsx`); hooks use `useSomething.ts`; server utilities use camelCase. Use `@frontend`, `@backend`, and `@shared` aliases where helpful. ESLint warns on `any` and unused values; prefix deliberately unused parameters with `_`.

Vitest uses jsdom and `tests/setup.ts`. Name tests `*.test.ts(x)` or `*.spec.ts(x)` in `tests/` or alongside their source. Add focused coverage for changed authorization, validation, API, public-profile, or analytics behavior. Run proportionate tests plus typecheck before handoff.

## Git, Secrets & Review

Before non-trivial work, inspect relevant code and `git status`; after changes, review `git diff` for unintended edits. Do not overwrite unrelated user changes, reset/discard work, commit, push, or deploy unless explicitly asked. Keep commits small and imperative, following history such as `feat(theme): add palette controls` or `fix(profile): handle invalid updates`. PRs should state impact, migrations/configuration, relevant issue, checks run, and frontend screenshots where useful.

Never commit or expose `.dev.vars`, `.wrangler/`, credentials, tokens, API keys, session secrets, Cloudflare/GitHub secrets, or private environment variables. Check whether a new variable is server-only before use; browser code must never receive server secrets. Remove debugging code introduced by your changes.

## Working Principle

Preserve functionality, data flow, analytics, authentication, APIs, D1, and CI/CD. Improve presentation and usability. Diagnose root cause before fixing; when scope is unclear, inspect first and change less.
