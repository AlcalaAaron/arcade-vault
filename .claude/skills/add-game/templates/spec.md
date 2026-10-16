# Esqueleto del spec generado por /add-game

Sustituye todo lo que va entre `<…>`. No copies texto que no aplique al juego. Formato idéntico a
`specs/05-asteroids-game.md` y `specs/06-games-table-leaderboard-supabase.md`.

````markdown
# SPEC NN — Integración del juego <TITLE>

> **Estado:** Borrador
> **Depende de:** 05-asteroids-game, 06-games-table-leaderboard-supabase<, otros juegos ya integrados>
> **Fecha:** YYYY-MM-DD
> **Objetivo:** Integrar <TITLE> como juego jugable de la plataforma con ID `<id>`, conectando su estado
> interno (<score, vidas, nivel…>) con el HUD React y guardando la puntuación final en su leaderboard.

---

## Scope

**In:**

- Fila `<id>` en la tabla `games` de Supabase (SQL en Data model).
- `components/games/<Pascal>Game.tsx` — componente canvas portado de `<references/started-games/NN-x/game.js | descripción>`.
  Props: `paused`, `onScoreChange`, `<onLivesChange>`, `<onLevelChange>`, `onGameOver`.
- `app/games/<id>/play/page.tsx` — play-page específica con HUD React, pausa, modal de game over y guardado del score.
- <Assets en `public/games/<id>/`.>
- <Portada `cover-<x>` en `app/globals.css`.>
- <Ampliación de `GameRow` en `lib/supabase/types.ts`.>

**Fuera de alcance:**

- `app/games/[id]/play/page.tsx`, `GamesGrid.tsx`, `app/games/page.tsx`, `app/games/[id]/page.tsx` y
  `app/hall-of-fame/*` — son data-driven desde Supabase; el juego aparece al insertar la fila.
- Supabase Auth: `user_id` se guarda como `null`. RLS y Realtime.
- Componente genérico `CanvasGame` / `GamePlayShell`: se copia el patrón de Asteroids.
- <Skins, temas, controles táctiles, leaderboard local del original…>
- Modificar `references/` o `AsteroidsGame`.

---

## Data model

Fila en `games`:

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  '<id>', '<TITLE>', '<short>',
  '<long>',
  '<ARCADE|PUZZLE|SHOOTER>', '<cover-x>', '<cyan|magenta|yellow|green>'
);
```

Props del componente:

```ts
interface <Pascal>GameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void; // solo si aplica
  onLevelChange: (level: number) => void; // solo si aplica
  onGameOver: (finalScore: number) => void;
}
```

La tabla `scores` y los tipos `GameRow`/`ScoreRow` ya existen (spec 06). <No se introduce ningún modelo nuevo.>

---

## Implementation plan

(Pasos de «Plan de implementación obligatorio» de SKILL.md, adaptados. Cada paso referencia
`.claude/skills/add-game/templates/*` y `.claude/skills/add-game/references/porting-guide.md`.)

---

## Acceptance criteria

- [ ] La card de <TITLE> aparece en `/games`.
- [ ] `/games/<id>` muestra los datos reales y el leaderboard top 10 (estado vacío si no hay scores).
- [ ] `/games/<id>/play` carga sin errores de SSR ni de TypeScript.
- [ ] El juego es jugable con <controles>.
- [ ] El HUD React refleja <score/vidas/nivel> en tiempo real.
- [ ] PAUSA congela el loop; REANUDAR lo reanuda.
- [ ] Al terminar la partida aparece el modal con la puntuación final.
- [ ] El nombre se pre-rellena desde `localStorage['av_player_name']`.
- [ ] Al guardar se inserta en `scores` con `game_id = '<id>'`, `user_id = null`, y se persiste `av_player_name`.
- [ ] El botón de guardar se deshabilita tras el primer envío.
- [ ] El score aparece en `/games/<id>` y en `/hall-of-fame` (tab de <TITLE>) al recargar.
- [ ] «JUGAR DE NUEVO» reinicia desde cero.
- [ ] `npm run build` completa sin errores.
- [ ] Asteroids y el resto de rutas existentes no se rompen.

---

## Decisions

- **Sí: …** razón.
- **No: …** razón.
````
