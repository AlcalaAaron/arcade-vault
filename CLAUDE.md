# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — online gaming platform where users play classic arcade games and compete for points on per-game leaderboards. Uses **Spec Driven Design** via the `/spec` and `/spec-impl` skills from `npx skills@latest add Klerith/fernando-skills` (see `skills-lock.json`).

## Stack

- **Next.js 16.4.x** with App Router — read `node_modules/next/dist/docs/` before writing Next.js code; APIs differ from training data
- **React 19.2.4**
- **Tailwind CSS v4** (PostCSS plugin via `@tailwindcss/postcss`)
- **TypeScript**
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) — auth + scores persistence
- **Resend** — contact form email delivery
- **ESLint 9** + **Prettier** (`.prettierrc`)

No test runner configured.

## Commands

`npm run dev` · `build` · `start` · `lint` · `format` · `format:check`

## Skills

Usa siempre `/frontend-design` para diseñar la interfaz de usuario.

- `/spec`, `/spec-impl` — flujo Spec Driven Design (Klerith/fernando-skills).
- `/add-game <carpeta de references/started-games | descripción>` — genera `specs/NN-<slug>-game.md` para un juego nuevo (no escribe código).
- `/spec-impl-game <spec>` — como `/spec-impl` pero, al terminar, lanza `skin-designer` y luego `mobile-porter` sobre el juego del spec.

## Agentes

Definiciones y detalle en `.claude/agents/<nombre>.md`.

- **`game-planner`** — sugiere el próximo juego a implementar.
- **`game-jam`** — genera specs de un juego a partir de un tema (`specs/game-jam/<game-id>/`).
- **`skin-designer`** — aplica los skins classic/retro/neon a un juego.
- **`mobile-porter`** — añade controles táctiles mobile (spec 10) a un juego.

## Hooks

`PostToolUse` sobre `Write|Edit` ejecuta `.claude/hooks/format-and-lint.mjs` (Prettier + ESLint sobre el archivo editado).

## Architecture

App Router exclusively — no `pages/` directory.

### Routes (`app/`)

- `layout.tsx` — root layout (Geist fonts, global CSS, `UserContext` provider, `Nav`)
- `page.tsx` — home / landing
- `about/` — about + contact form
- `api/contact/` — Resend-backed contact endpoint
- `auth/` — Supabase auth page
- `games/` — games index (`GamesGrid.tsx`) + una carpeta por juego con su `play/`: `arkanoid`, `asteroids`, `frogger`, `snake`, `tetris`
- `games/[id]/` — dynamic game detail with nested `play/` route
  (see `references/implemented-games.md` when you need to check which games are implemented and how to implement new ones.)
- `hall-of-fame/` — leaderboard / scores
- `context/UserContext.tsx` — client-side auth user context
- `data/` — static catalog: `games.ts`, `scores.ts`, `index.ts`
- `RevealObserver.tsx` — scroll-reveal animations

### Shared code

- `components/Nav.tsx` — top navigation
- `components/MobileGamepad.tsx` (+ `.module.css`) — gamepad táctil compartido, cableado en las play-pages
- `components/games/` — canvas game implementations (`ArkanoidGame`, `AsteroidsGame`, `FroggerGame`, `SnakeGame`, `TetrisGame`)
- `lib/supabase/` — `client.ts` (browser), `server.ts` (RSC/route handlers), `types.ts` (DB types)
- `public/` — sprite sheets (`spritesheet-breakout.png`, `fruits.png`) and audio (`ball-bounce.mp3`, `break-sound.mp3`)
- `references/` — catálogo de juegos implementados, sugerencias, skins (`game-with-themes.md`), templates de diseño y `started-games/`
- `demos/` — demos sueltas

### Specs

`specs/` holds the spec-driven design history (01 → 11): MVP screens, landing, about+contact, Supabase integration, each game, the shared games-table/leaderboard schema, mobile touch controls (10) and the neon gamepad skin (11). `specs/game-jam/<game-id>/` contiene los specs generados por `game-jam` (p. ej. `frogger`).

## Conventions

- Server Components by default; add `"use client"` only when needed (game canvases, auth context, interactive forms).
- New routes: folder under `app/` with `page.tsx`.
- Shared UI in `components/`; game logic colocated in `components/games/<Game>.tsx`.
- Supabase: import from `lib/supabase/server` in RSC / route handlers, `lib/supabase/client` in client components.
- New games follow the existing pattern: spec in `specs/`, canvas component in `components/games/`, route under `app/games/<name>/`, score writes through `lib/supabase`. Use `/spec-impl-game` so the game also gets its skins and mobile support.
