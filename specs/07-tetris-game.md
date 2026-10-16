# SPEC 07 — Integración del juego Tetris

> **Estado:** Aprobado
> **Depende de:** 05-asteroids-game, 06-games-table-leaderboard-supabase
> **Fecha:** 2026-10-16
> **Objetivo:** Integrar Tetris (canvas puro, con la pieza extra «tuerca») como juego jugable
> de la plataforma con ID `tetris`, conectando su estado (puntuación, vida única, nivel, fin
> de partida) con el HUD React y guardando la puntuación final en su leaderboard.

---

## Scope

**In:**

- Fila `tetris` en la tabla `games` de Supabase (SQL en Data model).
- `components/games/TetrisGame.tsx` — componente `"use client"` portado de
  `references/started-games/03-tetris/game.js`. Renderiza un único `<canvas>` de 800×600 con el
  tablero 10×20 y un panel lateral dibujado en canvas (SCORE, LÍNEAS, NIVEL, SIGUIENTE).
  Props: `paused`, `startLevel`, `onScoreChange`, `onLivesChange`, `onLevelChange`,
  `onPauseToggle`, `onGameOver`.
- Se conservan las mecánicas del original: las 8 piezas (incluida la «tuerca» `N`), rotación con
  wall kicks, pieza fantasma, soft drop (+1/fila) y hard drop (+2/celda), puntuación por líneas
  `[0, 100, 300, 500, 800] × nivel`, nivel = `floor(líneas / 10) + 1` y velocidad
  `max(100, 1000 − (nivel − 1) × 90)` ms.
- Vida única: al iniciar se notifica `onLivesChange(1)`; al terminar la partida, `onLivesChange(0)`
  y `onGameOver(score)`. El game over se dispara cuando la pieza nueva colisiona al aparecer.
- Teclas: ←/→ mover, ↓ soft drop, ↑ o X rotar, Espacio hard drop, P o Esc pausan/reanudan
  llamando a `onPauseToggle`. Los eventos de teclado con origen en un `<input>` se ignoran.
- `app/games/tetris/play/page.tsx` — play-page específica copiada del patrón de Asteroids: HUD
  React (Jugador, Puntuación, Vidas, Nivel), pausa, modal de game over y guardado del score.
- Selector de nivel inicial (1–15, botones −/+) en el overlay «EN PAUSA» y en el modal de game
  over. El valor elegido se pasa como `startLevel` al remontar el componente con `key` en
  «JUGAR DE NUEVO». La primera partida empieza siempre en nivel 1.
- Portada: se reutiliza `cover-tetro` (ya existe en `app/globals.css`); no se añade CSS.

**Fuera de alcance:**

- `app/games/[id]/play/page.tsx`, `app/games/GamesGrid.tsx`, `app/games/page.tsx`,
  `app/games/[id]/page.tsx` y `app/hall-of-fame/*` — son data-driven desde Supabase; el juego
  aparece al insertar la fila.
- Supabase Auth (`user_id` siempre `null`), RLS y Realtime.
- Guardar el nivel inicial, las líneas o el combo en `scores`: la tabla no cambia.
- Skins (neon, pastel, pixel), tema claro/oscuro, records locales en `localStorage`, panel de
  controles y menú de pausa propio del original.
- Combo máximo y líneas máximas (solo servían a la tabla de records local).
- Componente genérico `CanvasGame` o `GamePlayShell`: se copia el patrón de Asteroids.
- Controles táctiles o mobile.
- Modificar `references/` o `AsteroidsGame`.

---

## Data model

Fila en `games`:

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'tetris', 'TETRIS', 'Encaja las piezas y limpia líneas.',
  'Las piezas caen sin parar y solo tienes una vida. Muévelas y rótalas para completar líneas horizontales: cada línea despejada suma puntos y acelera la caída. Cuidado con la pieza tuerca, que deja un hueco imposible de rellenar. Si el montón llega arriba, se acabó.',
  'PUZZLE', 'cover-tetro', 'magenta'
);
```

Props del componente `TetrisGame`:

```ts
interface TetrisGameProps {
  paused: boolean;
  startLevel: number; // 1–15; se lee al montar, cambiarlo exige remontar con `key`
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void; // 1 al empezar, 0 al terminar
  onLevelChange: (level: number) => void;
  onPauseToggle: () => void; // P o Esc
  onGameOver: (finalScore: number) => void;
}
```

Convenciones del canvas (800×600):

- Tablero 10×20 de bloques de 30 px en `BOARD_X = 160`, `BOARD_Y = 0` (ocupa 300×600).
- Panel lateral dibujado desde `x = 500`: SCORE, LÍNEAS, NIVEL y SIGUIENTE (pieza en rejilla 4×4).
- Colores y formas de las 8 piezas copiados tal cual de `game.js` (`COLORS`, `PIECES`); solo se
  conserva el estilo de bloque `retro`.

No se introduce ningún modelo de datos persistente nuevo. La tabla `scores` y los tipos
`GameRow` / `ScoreRow` del spec 06 no cambian: `cat: 'PUZZLE'` y `color: 'magenta'` ya están
en sus uniones. El nombre del jugador reutiliza la clave `av_player_name` de `localStorage`.

---

## Implementation plan

1. **Fila en Supabase** — ejecutar el `INSERT` del Data model en el SQL Editor (o con el MCP de
   Supabase si está disponible). No se recrean tablas; si `games`/`scores` no existen, usar el
   DDL del spec 06.
   Verificación: la fila `tetris` aparece en el Table Editor; `/games` muestra la card de Tetris
   con portada `cover-tetro`, etiqueta PUZZLE y botón magenta. Hasta el paso 6, «JUGAR AHORA»
   cae en la play-page genérica de `[id]/play` (placeholder), que sigue funcionando.

2. **Esqueleto de `components/games/TetrisGame.tsx`** — según
   `.claude/skills/add-game/templates/game-component.tsx.md`: `'use client'`, props de Data model,
   refs para `paused` y callbacks, `useEffect` con `[]`, `<canvas>` 800×600, loop con `dt`
   acotado, notificación de cambios (`prevScore`, `prevLevel`, `prevLives`), flag `gameOverFired`
   y cleanup de RAF y listeners. `startLevel` se lee al montar.
   Verificación: `npm run lint` y `npx tsc --noEmit` sin errores; el componente aún no se usa.

3. **Lógica del juego** — portar de `game.js`: `COLS/ROWS/BLOCK`, `COLORS`, `PIECES` (8 formas),
   `LINE_SCORES`, `createBoard`, `randomPiece`, `collide`, `rotateCW` + `tryRotate` con kicks
   `[0, -1, 1, -2, 2]`, `merge`, `clearLines` (líneas, puntos, nivel y velocidad), `ghostY`,
   `hardDrop` (+2/celda), `softDrop` (+1/fila), `lockPiece`, `spawn` y la gravedad por acumulador
   `dropAccum` / `dropInterval` (ms). Eliminar `combo`, `maxCombo`, records, skins y DOM.
   El estado inicial usa `level = startLevel` y notifica `onLivesChange(1)`.
   Verificación: `tsc` y `lint` sin errores.

4. **Dibujo** — tablero en `BOARD_X = 160`, rejilla con color fijo
   `rgba(255,255,255,0.08)` (el original lo leía de una variable CSS del body), bloques estilo
   `retro`, pieza fantasma a `globalAlpha = 0.2`, pieza actual y panel desde `x = 500` con
   SCORE, LÍNEAS, NIVEL y SIGUIENTE. Sin overlay de game over ni de pausa en canvas.
   Verificación: `tsc` y `lint` sin errores.

5. **Teclado, pausa y fin de partida** — `keydown` en `window` (los eventos con `target`
   `HTMLInputElement` se ignoran): ←/→ mover, ↓ soft drop, ↑/`KeyX` rotar, Espacio hard drop
   (con `preventDefault` en flechas y Espacio), `KeyP`/`Escape` llaman a `onPauseToggle` también
   estando en pausa. Con `paused` o `gameover` no se procesa ninguna otra tecla. Se ignora
   `e.repeat` para Espacio y rotación. Cuando `spawn()` colisiona: `state = 'gameover'`,
   `onLivesChange(0)` y `onGameOver(score)` una sola vez.
   Verificación: `tsc` y `lint` sin errores.

6. **Play-page `app/games/tetris/play/page.tsx`** — según
   `.claude/skills/add-game/templates/play-page.tsx.md`: `dynamic(..., { ssr: false })`, estado
   `score/lives(=1)/level/paused/over/name/saved/gameKey`, más `startLevel` (1 por defecto).
   `onPauseToggle` alterna `paused` solo si `!over`; `paused={paused || over}`. Selector −/+
   (1–15) en el overlay «EN PAUSA» y en el modal, con el texto «Se aplica en la próxima partida».
   `restart()` hace `setLevel(startLevel)`, `setLives(1)` y remonta con `key`. `saveScore()`
   inserta `{ game_id: 'tetris', player_name, score, user_id: null }`, persiste `av_player_name`
   y, si el insert devuelve `error`, vuelve a habilitar el botón. `crt-bottom`:
   `TETRIS · CRT-83 · 60 HZ`; «SALIR» lleva a `/games/tetris`.
   Verificación: `/games/tetris/play` carga y es jugable; el HUD React muestra puntuación, 1 vida
   y nivel; PAUSA, REANUDAR, P y Esc funcionan; el modal aparece al perder.

7. **Verificación final** — `npm run build` y `npm run lint` sin errores. Con Playwright MCP
   recorrer `/games` → `/games/tetris` → `/games/tetris/play` → pulsar Espacio repetidamente
   hasta perder (cada caída suma puntos) → guardar → comprobar el score en `/games/tetris` y
   en el tab TETRIS de `/hall-of-fame`. Capturas en `.playwright-screenshots/`.

---

## Acceptance criteria

- [ ] La fila `tetris` existe en `games` con `cat = 'PUZZLE'`, `cover = 'cover-tetro'` y `color = 'magenta'`.
- [ ] La card de Tetris aparece en `/games` y el filtro PUZZLE la muestra.
- [ ] `/games/tetris` muestra los datos reales y, sin scores, el mensaje «Sé el primero en entrar al salón de la fama».
- [ ] `/games/tetris/play` carga sin errores de SSR, de TypeScript ni de consola.
- [ ] El canvas dibuja el tablero 10×20, la pieza fantasma y el panel con SCORE, LÍNEAS, NIVEL y SIGUIENTE.
- [ ] Son jugables ←/→ (mover), ↓ (soft drop), ↑ y X (rotar) y Espacio (hard drop).
- [ ] `PIECES` contiene 8 formas; la octava es la tuerca 3×3 con hueco central.
- [ ] Soft drop suma 1 punto por fila, hard drop suma 2 por celda y una línea en nivel 1 suma 100.
- [ ] El nivel sube cada 10 líneas y la velocidad de caída aumenta con él.
- [ ] El HUD React muestra puntuación y nivel en tiempo real, y «Vidas» muestra `♥` durante la partida y `—` al terminar.
- [ ] El botón PAUSA congela el juego y REANUDAR lo reanuda.
- [ ] P y Esc alternan la pausa; en pausa, el resto de teclas no mueven la pieza.
- [ ] Escribir en el campo de nombre del modal (incluidos espacio y la letra P) no pausa, no mueve piezas y no se bloquea.
- [ ] Al colisionar la pieza nueva al aparecer, se abre el modal con la puntuación final, y `onGameOver` se dispara una sola vez.
- [ ] El selector de nivel inicial está limitado a 1–15 y aparece en «EN PAUSA» y en el modal.
- [ ] «JUGAR DE NUEVO» reinicia con score 0, 1 vida y el nivel inicial elegido; la primera partida empieza en nivel 1.
- [ ] El modal pre-rellena el nombre desde `localStorage['av_player_name']` si existe.
- [ ] Al guardar se inserta en `scores` con `game_id = 'tetris'` y `user_id = null`, y se persiste `av_player_name`.
- [ ] El botón de guardar se deshabilita tras el primer envío y se vuelve a habilitar si el insert falla.
- [ ] El score guardado aparece en `/games/tetris` y en el tab TETRIS de `/hall-of-fame` al recargar.
- [ ] `TetrisGame.tsx` no contiene referencias a `localStorage`, skins, tema ni combo.
- [ ] `npm run build` y `npm run lint` completan sin errores.
- [ ] `/games/asteroids/play`, `/games/[id]/play` y el resto de rutas existentes no se rompen.
- [ ] `git diff` no muestra cambios en `references/` ni en `AsteroidsGame.tsx`.

---

## Decisions

- **Sí: un solo canvas 800×600 con el panel dibujado en canvas** — encaja en el `.crt-screen`
  4:3, mantiene una única interfaz de props y es coherente con el HUD de canvas de Asteroids.
  Coste: hay que recalcular los offsets de dibujo del original.
- **No: dos canvas DOM (`#board` y `#next-canvas`)** — el escalado de un tablero 1:2 dentro de
  una caja 4:3 es más delicado y no aporta nada visible.
- **Sí: vida única notificada con `onLivesChange(1)` → `(0)`** — la plataforma muestra vidas en
  todos los juegos; Tetris simplemente tiene una.
- **Sí: líneas solo en el panel del canvas, sin `onLinesChange`** — el HUD React no tiene hueco
  para ellas y se evita ampliar la API.
- **Sí: conservar la octava pieza «tuerca»** — port fiel; el código manda sobre el README, que
  habla de 7 piezas.
- **Sí: P/Esc vía `onPauseToggle`** — el estado de pausa vive en la play-page (única fuente de
  verdad), igual que con el botón PAUSA.
- **Sí: `startLevel` como prop leída al montar y aplicada remontando con `key`** — mismo patrón
  de reinicio que Asteroids; el efecto del loop sigue con `[]`.
- **Sí: selector de nivel inicial en pausa y modal, aplicado a la próxima partida** — fiel al
  original; la primera partida empieza siempre en nivel 1.
- **Sí: permitir guardar scores con nivel inicial > 1 en el mismo ranking** — separar el ranking
  exigiría una columna `start_level` y cambiar queries; queda para un spec futuro.
- **Sí: ignorar `keydown` con `target` `<input>`** — evita que Espacio o P del nombre afecten a
  la partida. `AsteroidsGame` no se toca, aunque hoy no lo hace.
- **Sí: ignorar `e.repeat` en Espacio y rotación** — en el original, mantener Espacio encadena
  hard drops. Las flechas conservan el autorepeat. Es un cambio deliberado de comportamiento.
- **Sí: `paused={paused || over}` en la play-page** — el juego queda congelado mientras el modal
  está abierto, también tras pulsar FIN.
- **Sí: comprobar `error` del `insert` y revertir `saved`** — mejora sobre la play-page de
  Asteroids, aplicada solo a juegos nuevos.
- **Sí: una play-page por juego** — se copia el patrón de Asteroids (decisión del spec 05).
- **No: skins, tema claro/oscuro, records locales, panel de controles, combo y líneas máximas** —
  la plataforma los reemplaza (pausa, leaderboard en Supabase) o no tienen columna en `scores`.
- **No: `CanvasGame` ni `GamePlayShell` genéricos** — decisión del usuario de copiar el patrón.

---

## Risks

| Riesgo                                                             | Mitigación                                                                       |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| El ranking mezcla partidas con nivel inicial distinto              | Riesgo asumido y documentado; spec futuro con columna `start_level`.             |
| Las puntuaciones de prueba del paso 7 quedan en `scores` (sin RLS) | Borrarlas desde el Table Editor al terminar la verificación.                     |
| Fugas de RAF o listeners al remontar con `key`                     | Cleanup completo en el `return` del efecto (RAF, `keydown`, `keyup`).            |
| Esc o P capturados por el navegador o por el foco en un elemento   | Listener en `window`; los eventos con `target` `<input>` se ignoran a propósito. |
