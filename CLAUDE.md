# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — an online gaming platform where users play and compete for points. Built with **Spec Driven Design**: every feature starts as a spec in `specs/` (via `/spec`) and is implemented from it (via `/spec-impl`).

## Stack

- **Next.js 16.2.6** with App Router (`app/` directory) — read `node_modules/next/dist/docs/` before writing Next.js code; APIs differ from training data
- **React 19.2.4**
- **Tailwind CSS v4** (PostCSS plugin via `@tailwindcss/postcss`)
- **TypeScript** — path alias `@/*` → project root (e.g. `@/components/Nav`, `@/app/data`)
- **Resend** (`resend`) — transactional email from the contact form
- **Prettier** + **ESLint** (`eslint-config-next` core-web-vitals + typescript)

No test runner is configured yet.

## Commands

```bash
npm run dev      # dev server (port 3000)
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario.

| Skill              | Use                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `/spec`            | Write a new spec in `specs/NN-kebab-name.md` from the template (`.agents/skills/spec/template.md`) |
| `/spec-impl`       | Implement an approved spec and update its **Estado**                                               |
| `/frontend-design` | Any UI work — keep the retro-arcade / neon CRT aesthetic                                           |
| `/worktree`        | Run a task in an isolated git worktree under `.trees/[name]`                                       |

`spec` and `spec-impl` come from `npx skills@latest add Klerith/fernando-skills` (pinned in `skills-lock.json`). Their source lives in `.agents/skills/`; `.claude/skills/spec*` are pointers to it.

## Agents

Project subagents live in `.claude/agents/`.

| Agent          | Use                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `game-planner` | Plans and decides which new game fits the platform: 1 main pick + 2 alternatives, scored against the platform's fit criteria, ending with a `/spec` hand-off |

`game-planner` details:

- **Invoke** it to propose, compare or prioritise games, and to record a decision on a past suggestion ("acepto X, spec NN", "descarto Y porque…", "Z ya está implementado").
- **Memory** (`memory: project`) in `.claude/agent-memory/game-planner/`: `MEMORY.md` (short index loaded at start: learned preferences + suggestions table) and `sugerencias.md` (one entry per game with its state: `sugerido` / `aceptado` / `descartado` / `implementado`). It never re-suggests a game already in memory, already on the platform or in the mock catalog.
- **To-do**: rewrites `references/game-suggestions-todo.md` on every run (Pendientes / En curso / Hechos / Descartados, one line per game), kept in sync with its memory.
- **Reads** `references/implemented-games.md`, `app/data/games.ts`, `specs/`, `references/started-games/` and `app/globals.css`. It writes only its memory and the to-do — never app code.

## Specs

| #   | Spec                                    | Delivers                                                                                   |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| 01  | `specs/01-mvp-visual-screens.md`        | Nav + library, game detail, player, auth and Hall of Fame screens (visual only, mock data) |
| 02  | `specs/02-home-landing-page.md`         | `/` becomes the landing page; library moves to `/games`                                    |
| 03  | `specs/03-about-page-contact-resend.md` | `/about` page + contact form that sends real email via Resend                              |

Specs are written in Spanish and carry a header with `Estado`, `Depende de` and `Fecha`. Read the relevant spec (and its out-of-scope list) before changing a feature.

## Architecture

App Router only — no `pages/` directory. Server Components by default; `"use client"` only when needed (most interactive pages are client components).

### Routes

| Route               | File                           | Notes                                                                      |
| ------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `/`                 | `app/page.tsx`                 | Landing: hero, features, game rail, stats, live activity, pricing, CTA     |
| `/games`            | `app/games/page.tsx`           | Library: category filters, search, 3D-tilt game cards                      |
| `/games/[id]`       | `app/games/[id]/page.tsx`      | Game detail + leaderboard                                                  |
| `/games/[id]/play`  | `app/games/[id]/play/page.tsx` | Player: HUD, simulated score, pause / game-over overlays (no real game)    |
| `/hall-of-fame`     | `app/hall-of-fame/page.tsx`    | Podium + per-game score tables                                             |
| `/auth`             | `app/auth/page.tsx`            | Login / register tabs (visual only, no backend)                            |
| `/about`            | `app/about/page.tsx`           | About section + contact form                                               |
| `POST /api/contact` | `app/api/contact/route.ts`     | Receives `{ name, email, msg }`, sends via Resend → `{ ok }` / `{ error }` |

Dynamic route `params` are a `Promise` (unwrap with `use(params)` in client components / `await` in server components).

### Shared code

- `app/layout.tsx` — root layout: `UserProvider`, background layers (`.av-bg`, `.av-noise`), `Nav`, `<main className="av-main">`, footer.
- `components/Nav.tsx` — top nav with active-link state, coin counter, auth button, mobile hamburger drawer. Shared UI goes in `components/`.
- `app/context/UserContext.tsx` — mock auth: `useUser()` → `{ user, login, signOut }`, persisted in `localStorage` (`av_user`).
- `app/data/` — mock data, import from `@/app/data`: `GAMES` (`games.ts`) and `seededScores(seed, count)` (`scores.ts`). No database yet.
- `app/globals.css` — the whole visual theme: CSS variables (`--bg`, `--cyan`, `--magenta`, `--pixel`, `--mono`…), fonts (Press Start 2P, JetBrains Mono via Google Fonts), CRT/scanline/neon effects, animations (`fade-in`, `flicker`, `blink`, `.reveal` / `.in` scroll reveal). Reuse these classes and variables instead of inventing new colors.
- `demos/` — scratch components, not part of the app.

### References (read-only)

- `references/templates/` — original HTML/JSX prototype the screens are ported from (`biblioteca`, `detalle`, `reproductor`, `salon`, `auth`, `home-about/`). Consult it when building or matching a screen.
- `references/started-games/` — standalone vanilla-JS games (Asteroids, Tetris, Arkanoid) to be integrated as real games later.
- `references/implemented-games.md` — status of the real games (DB rows, specs, components, branches).
- `references/game-suggestions-todo.md` — game suggestions to-do, owned by the `game-planner` agent (not read-only: let the agent update it).

## Environment & integrations

- `.env` (git-ignored; template in `.env.template`): `RESEND_API_KEY`, `SB_PWD` (Supabase DB password).
- **Supabase MCP** — server config in `references/.mcp.json`, enabled via `.claude/settings.local.json`. Supabase is not yet used by the app code.
- **Playwright MCP** — save screenshots in `.playwright-screenshots/` (git-ignored except `.gitkeep`).

## Code style & hooks

- `.claude/settings.json` runs `.claude/hooks/format-and-lint.mjs` after every Write/Edit: Prettier `--write`, ESLint `--fix`, and trailing-whitespace strip. ESLint errors fail the hook — fix them before moving on.
- Prettier (`.prettierrc`): single quotes, semicolons, 2-space indent, trailing commas, `printWidth` 80, LF line endings.
- UI copy is in Spanish.
