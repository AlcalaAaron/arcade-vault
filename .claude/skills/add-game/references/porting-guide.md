# Guía de portado: JS vanilla → componente de Arcade Vault

Para redactar el spec (y después para `/spec-impl`). Aplica a juegos de `references/started-games/` y a juegos
escritos desde cero.

## Reglas universales

1. **Todo el estado del juego vive dentro del `useEffect` del componente** (variables de closure), con `[]` como
   dependencias. Reiniciar = remontar con `key` desde la play-page; nunca resetear desde fuera.
2. **Comunicación solo por props/callbacks**: `paused` (por ref), `onScoreChange`, `onLivesChange`, `onLevelChange`,
   `onGameOver(finalScore)`. Los callbacks se llaman solo cuando el valor cambia (`prevX`), y `onGameOver` una sola
   vez (`gameOverFired`).
3. **Pausa**: con `pausedRef.current === true` el loop sigue llamando a `draw()` pero no a `update()`. Eliminar la
   pausa interna del original (Esc/P, overlays, botones): la controla la plataforma.
4. **Cleanup completo** en el `return` del efecto: `cancelAnimationFrame`, todos los `addEventListener`
   (`window`, `document`, `canvas`), temporizadores y `Audio` (`pause()`).
5. **Teclado**: `preventDefault` solo para las teclas del juego, y no cuando `e.target` es un `<input>`
   (el modal de game over tiene un campo de nombre).
6. **Sin DOM del original**: sustituir `getElementById` de HUD (`score`, `lines`, `level`…) por callbacks; el HUD
   canvas propio del juego se conserva.
7. **Eliminar lo que ahora hace la plataforma**: overlay de game over / «pulsa X para reiniciar», leaderboard en
   `localStorage`, formulario de nombre, botones de reiniciar, selectores de nivel inicial, temas/skins
   (salvo que el usuario pida conservarlos).
8. **Sin SSR**: la play-page importa el componente con `dynamic(..., { ssr: false })`.
9. **`dt` acotado** (`Math.min(dt, 0.05)`) si el original usa delta de tiempo; conservar la física tal cual.
10. **TypeScript estricto**: tipar clases y campos; usar `!` en `canvasRef.current!` y `getContext('2d')!` como en Asteroids.

## Assets y datos

- Imágenes y sonidos → `public/games/<id>/…`; rutas absolutas desde la raíz (`/games/<id>/sprites.png`),
  nunca relativas (`assets/…`), porque la página vive en `/games/<id>/play`.
- Cargar `Image`/`Audio` dentro del efecto, esperar a `onload` antes de arrancar el loop si el dibujo depende de ellos.
- Datos grandes (`levels.js` → `LEVELS`) → módulo `.ts` tipado junto al componente
  (`components/games/<id>/levels.ts`), importado con `import`.
- Scripts globales del original (`spritesheet.js` con `loadSpritesheet`, `drawSprite`…) → módulo `.ts` que exporta
  esas funciones; nada de variables globales en `window`.

## Notas por juego de referencia

### 02-asteroids — ya integrado

`components/games/AsteroidsGame.tsx` y `app/games/asteroids/play/page.tsx` son la plantilla. No se vuelve a integrar.

### 03-tetris

- Dos canvas en el original (`#board` 300×600 y `#next-canvas` 120×120) y HUD en el DOM (`#score`, `#lines`, `#level`).
  El componente renderiza ambos canvas (p. ej. un `<div>` flex con dos `<canvas>`) y comunica `score` y `level`.
  `lines` no tiene hueco en el HUD actual: decidir en Fase 2 si se ignora o se añade un callback `onLinesChange`.
  Tetris no tiene vidas: omitir `onLivesChange` y el `hud-stat` de vidas.
- Pausa con Esc/P y overlay propio, controles de nivel inicial, tema claro/oscuro, skins y records en `localStorage`
  (`RECORDS_KEY`, `tetris-skin`, `tetris-theme`): eliminar, salvo petición explícita.
- Game over = `endGame()` cuando la pieza nueva colisiona al aparecer → `onGameOver(score)`.
- Teclas: flechas, espacio (hard drop), `P`/`Escape`. `preventDefault` en flechas y espacio.
- `index.html` usa fuentes/estilos propios en `style.css`: no se importan; el aspecto lo da la plataforma (`.crt`).
- `README.md`/`CLAUDE.md` del juego describen constantes ajustables (`COLS`, `ROWS`, `BLOCK`); si se cambian, ajustar
  también `width`/`height` del canvas.
- Sugerencia de catálogo: `cat: 'PUZZLE'`, `cover: 'cover-tetro'`.

### 04-arkanoid

- Listeners de `mousemove` y `click` sobre el canvas (movimiento de la pala, lanzar la bola, reiniciar): conservar
  los de movimiento/lanzamiento sobre el `canvas` con cleanup; el reinicio por clic lo asume «JUGAR DE NUEVO».
- Estados `playing | paused | gameover | win`: la pausa sale; `win` → decidir en Fase 2 si dispara `onGameOver`
  con el score actual (recomendado) o se encadena el siguiente nivel.
- `levels.js` (`LEVELS`, `blocks[]`, `ballSpeedMultiplier`) y `assets/spritesheet.js` + `spritesheet-breakout.png`
  - `assets/sounds/ball-bounce.mp3` y `break-sound.mp3` → `public/games/arkanoid/` y módulos `.ts`.
- `new Audio(...)` dentro del efecto; `pause()` en cleanup. Los navegadores bloquean audio hasta la primera
  interacción: el primer clic/tecla del usuario ya lo habilita.
- Vidas (3) y niveles (`currentLevel`, 0-indexed → mostrar `+1`): usar `onLivesChange` y `onLevelChange`.
- El canvas es 800×600, igual que Asteroids.
- Sugerencia de catálogo: `cat: 'ARCADE'`, `cover: 'cover-bricks'`.

## Juego desde cero (sin referencia)

Aplica las reglas universales y escribe el juego como una sola función de efecto con las secciones
`Input / Entidades / Estado / update / draw / Loop` (como `AsteroidsGame.tsx`). El spec debe describir: mecánica,
controles, puntuación, condición de fin y valores del HUD. Prioriza un alcance pequeño y jugable.

## Catálogo disponible

Clases de portada en `app/globals.css`: `cover-bricks`, `cover-tetro`, `cover-snake`, `cover-glot`,
`cover-invaders`, `cover-rocas`, `cover-rana`, `cover-duelo`. Reutiliza una si encaja; si no, el spec debe incluir
añadir una nueva (nombre `cover-<x>`, fondo en degradado/radial y un `::after` simple, como las existentes).
Uniones válidas hoy (`lib/supabase/types.ts`): `cat` = `ARCADE | PUZZLE | SHOOTER`; `color` =
`cyan | magenta | yellow | green`.
