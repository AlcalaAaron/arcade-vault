# Juegos de Arcade Vault

Estado de los juegos de la plataforma a fecha **2026-10-23**, cruzando la base de datos
(Supabase), las specs y el código de las ramas.

## Resumen

| Juego     | ID          | En BD (`games`) | Spec                | Estado spec         | Componente                           | Play-page                                 | Rama                             |
| --------- | ----------- | --------------- | ------------------- | ------------------- | ------------------------------------ | ----------------------------------------- | -------------------------------- |
| Asteroids | `asteroids` | ✅              | `05-asteroids-game` | Implementado        | `components/games/AsteroidsGame.tsx` | `app/games/asteroids/play/page.tsx`       | `02-spec`, `spec-07-tetris-game` |
| Tetris    | `tetris`    | ✅              | `07-tetris-game`    | Aprobado (en curso) | `components/games/TetrisGame.tsx`    | ❌ falta `app/games/tetris/play/page.tsx` | `spec-07-tetris-game`            |
| Arkanoid  | —           | ❌              | —                   | —                   | —                                    | —                                         | solo en `references/`            |

> Ninguno de estos juegos está todavía en `main`: allí `/games` sigue usando el catálogo mock
> de `app/data/games.ts` y el reproductor simula la puntuación.

## Base de datos

Proyecto Supabase `ostlfxubljhaggovjiqk`, esquema `public`.

### Tabla `games`

| id          | title     | cat     | cover         | color     | created_at           |
| ----------- | --------- | ------- | ------------- | --------- | -------------------- |
| `asteroids` | ASTEROIDS | SHOOTER | `cover-rocas` | `yellow`  | 2026-10-16 09:23 UTC |
| `tetris`    | TETRIS    | PUZZLE  | `cover-tetro` | `magenta` | 2026-10-16 09:23 UTC |

### Tabla `scores`

Vacía: todavía no se ha guardado ninguna partida.

## Detalle

### Asteroids — implementado

- **Descripción (BD):** Pulveriza rocas en gravedad cero. Tu nave triangular flota en vacío
  absoluto; dispara y rota para dividir rocas en fragmentos cada vez más pequeños.
- **Origen:** `references/started-games/02-asteroids/` (canvas HTML5 vanilla).
- **Specs:** `05-asteroids-game` (integración) y `06-games-table-leaderboard-supabase`
  (tabla `games`, leaderboard real en `scores` y guardado del score al terminar la partida),
  ambas **Implementado**.
- **Controles:** `←` `→` rotar · `↑` propulsar · `Espacio` disparar.
- **Integración:** HUD React (jugador, puntuación, vidas, nivel), pausa, modal de game over
  y guardado de la puntuación en Supabase.

### Tetris — en curso

- **Descripción (BD):** Encaja las piezas y limpia líneas. Una sola vida; cuidado con la
  pieza «tuerca», que deja un hueco imposible de rellenar.
- **Origen:** `references/started-games/03-tetris/`.
- **Spec:** `07-tetris-game`, **Aprobado** (pendiente de pasar a Implementado).
- **Hecho:** fila en `games` y componente `TetrisGame.tsx` (tablero 10×20, 8 piezas con la
  «tuerca», wall kicks, pieza fantasma, soft/hard drop, niveles y velocidad del original).
- **Pendiente:** la play-page `app/games/tetris/play/page.tsx` (HUD, pausa, selector de
  nivel inicial 1–15, modal de game over y guardado del score). Sin ella el componente no se
  usa en ninguna ruta.
- **Controles:** `←` `→` mover · `↓` soft drop · `↑` / `X` rotar · `Espacio` hard drop ·
  `P` / `Esc` pausa.

### Arkanoid — no integrado

- **Origen:** `references/started-games/04-arkanoid/` — juego vanilla completo con sprites,
  5 niveles, explosiones y sonidos.
- No tiene fila en `games`, spec de integración ni componente en la app.

## Catálogo mock (no implementado)

`app/data/games.ts` en `main` contiene seis juegos de ejemplo usados solo en las pantallas
visuales del spec 01: **Bloque Buster**, **Caída**, **Serpentina**, **Glotón**,
**Invasores** y **Rocas**. No son jugables; Rocas, Caída y Bloque Buster son los
equivalentes mock de Asteroids, Tetris y Arkanoid.
