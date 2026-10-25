# Runway — working notes

Runway is a money app for college students that graduates with them: Taxi (college) → Takeoff (senior year to first job) → Cruising Altitude (long-term). It is free and keeps data on the user's device; paid add-ons (Sync, Bank Link) come later, Obsidian-style.

**Read [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) before starting work on a milestone**, and update it when a decision changes. The owner is not a professional developer: explain technical choices in plain language.

## Status

- M0 (setup) done. Live at https://runway-life-budgeting.vercel.app (Vercel Hobby plan; every push to `main` redeploys). Code: https://github.com/Freshy5740/Runway-Life-Budgeting (public).
- Git identity for this repo is the owner's GitHub account `Freshy5740` with its noreply email. Never commit with a personal email.
- M1 (prototype rebuilt on this stack) built and verified locally; publishing it is the last step. Next: M2.
- M0 shipped with silent auto-updates and M1 switched to "ask, then reload". Anyone who opened M0 keeps seeing it until every Runway tab/app window is closed once; after that, updates show a Reload banner.

## Testing notes

- Engine tests compare against the prototype: `node scripts/prototype-oracle.mjs` runs the prototype's own math on the sample plan in `src/engines/__fixtures__/samplePlan.ts`.
- To load realistic data in the dev server, import a backup through the app's own code from the browser console: `const b = await import('/src/db/backup.ts'); await b.restoreBackup(b.parseBackup(json))`.
- If the Browser preview starts the wrong server, the session began in another folder: the preview tool reads that folder's `.claude/launch.json`, not this one.

## Commands

`npm run dev` · `npm run build` · `npm run preview` · `npm test` / `npm run test:run` · `npm run lint` · `npm run format` · `npm run icons`

Windows: if `node`, `npm` or `git` aren't found in a shell, refresh PATH first:
`$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`

## Stack

Vite 8 + React 19 + TypeScript 6 · vite-plugin-pwa (installable + offline) · Dexie (IndexedDB) · Vitest · oxlint · Prettier. No backend in the free tier.

## Layout

- `src/app/` — app shell and navigation
- `src/features/<area>/` — screens and their hooks/styles (`tarmac/`, `flight-plan/`, `baggage-claim/`, `sky-miles/`, `privacy/`)
- `src/components/` — shared pieces: money/text inputs, cards, toggles, toasts, and `charts/`
- `src/engines/` — pure calculation code (budgets, loans, paychecks, scores) with `*.test.ts` beside each file
- `src/db/` — Dexie schema and data access
- `src/lib/` — small shared helpers (`money.ts`, dates)
- `src/styles/` — `tokens.css` (all colors, light + dark) and `global.css`
- `reference/` — the original single-file prototype; read-only, the source of truth for M1 behavior
- `docs/` — build plan and other decisions
- `scripts/` — `prototype-oracle.mjs` (the prototype's math, for test answers)

## Rules

- **Money is integer cents** in storage and engine inputs (`src/lib/money.ts`). Format only at display time with `formatMoney`.
- **Engines are pure functions with tests.** Any change to money math needs passing tests. When porting from the prototype, use the prototype's own outputs as expected values.
- **Every stored record has** `id` (`crypto.randomUUID()`), `createdAt`, `updatedAt`, `deletedAt` (soft delete). This is what makes paid Sync possible later. Settings in `prefs` use the setting's name as their id. Write through `src/db/records.ts` helpers; screens read everything through `useData()` / `usePlan()` (`src/app/plan.ts`).
- **Charts** follow the dataviz rules: categorical colors `--cat-1..5` in fixed order (validated for color blindness), status colors `--good`/`--bad` only for good/bad, a legend for 2+ series, hover + keyboard readouts, and a "Show as table" view.
- **Schema changes** add a new `db.version(n)` with an upgrade function; never edit a version that has shipped.
- **User data never leaves the device** in the free tier: no analytics, trackers, or network calls carrying user data.
- **Colors only through tokens** in `src/styles/tokens.css`; every screen must work in light and dark mode and at 375px wide.
- **Federal loan rules live in data tables**, not scattered conditionals (BUILD_PLAN §6). Projections show "not financial advice".
- Code style: Prettier (no semicolons, single quotes, width 100) and oxlint. Run `npm run lint`, `npm run test:run` and `npm run build` before calling work done.

## Names (aviation theme)

Tarmac = dashboard · Flight Plan = budget · Baggage Claim = loans & debt · Sky Miles = savings · Envelopes = savings for wants · Altitude = net worth · Turbulence = weekly stress check-in · Weather Radar = spending heat map · Logbook = year in review · Waypoints = milestones · Hangar = house fund · Transfers = moving between phases · Flight Status = health score (proposed)
