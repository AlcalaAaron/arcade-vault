# Esqueleto: `components/games/<Pascal>Game.tsx`

Extraído de `components/games/AsteroidsGame.tsx` (spec 05). Si el código vigente difiere, **manda el código vigente**.
Se guarda como `.md` para que `tsc`/ESLint no lo procesen; al implementar se crea el `.tsx` real.

Sustituye `<Pascal>`, `W`/`H` (tamaño del canvas del juego original) y rellena el bloque marcado `GAME`.
Elimina `onLivesChange`/`onLevelChange` y sus refs si el juego no tiene vidas/nivel.

```tsx
'use client';

import { useEffect, useRef } from 'react';

interface <Pascal>GameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

export default function <Pascal>Game({
  paused,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: <Pascal>GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs so the game loop always reads the latest prop values without re-running the effect
  const pausedRef = useRef(paused);
  const cbScore = useRef(onScoreChange);
  const cbLives = useRef(onLivesChange);
  const cbLevel = useRef(onLevelChange);
  const cbOver = useRef(onGameOver);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    cbScore.current = onScoreChange;
  }, [onScoreChange]);
  useEffect(() => {
    cbLives.current = onLivesChange;
  }, [onLivesChange]);
  useEffect(() => {
    cbLevel.current = onLevelChange;
  }, [onLevelChange]);
  useEffect(() => {
    cbOver.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const W = 800;
    const H = 600;

    // ── Input ──────────────────────────────────────────────────────────────
    const GAME_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const keys: Record<string, boolean> = {};
    const justPressed: Record<string, boolean> = {};

    function onKeyDown(e: KeyboardEvent) {
      // The game-over modal has a name <input>: never swallow its keystrokes
      if (e.target instanceof HTMLInputElement) return;
      justPressed[e.code] = !keys[e.code];
      keys[e.code] = true;
      if (GAME_KEYS.includes(e.code)) e.preventDefault();
    }
    function onKeyUp(e: KeyboardEvent) {
      keys[e.code] = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function pressed(code: string) {
      const val = justPressed[code];
      justPressed[code] = false;
      return val;
    }

    // ── GAME ───────────────────────────────────────────────────────────────
    // Port of the original game.js: classes, constants, state, update(dt), draw().
    // Rules:
    //  - Keep the canvas HUD (score/level/lives) exactly as in the original.
    //  - Remove the canvas "GAME OVER" / "PRESS X TO RESTART" overlay: the React modal replaces it.
    //  - Remove anything that belongs to the platform: pause overlay, restart button, local records.
    //  - State lives in these closure variables; initGame() resets all of them.
    let score = 0;
    let lives = 3;
    let level = 1;
    let state: 'playing' | 'gameover' = 'playing';
    let gameOverFired = false;

    // Previous values to avoid spamming callbacks
    let prevScore = -1;
    let prevLives = -1;
    let prevLevel = -1;

    function initGame() {
      score = 0;
      lives = 3;
      level = 1;
      state = 'playing';
      gameOverFired = false;
      prevScore = -1;
      prevLives = -1;
      prevLevel = -1;
      // …create entities…
    }

    function update(dt: number) {
      if (state === 'gameover') return;
      // …game logic; set state = 'gameover' when the run ends…
      void dt;
      void pressed;
      void keys;
    }

    function draw() {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      // …entities + canvas HUD…
    }

    // ── Loop ───────────────────────────────────────────────────────────────
    let rafId: number;
    let lastTime: number | null = null;

    function loop(ts: number) {
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;

      if (!pausedRef.current) update(dt);
      draw();

      // Notify React of state changes
      if (score !== prevScore) {
        cbScore.current(score);
        prevScore = score;
      }
      if (lives !== prevLives) {
        cbLives.current(lives);
        prevLives = lives;
      }
      if (level !== prevLevel) {
        cbLevel.current(level);
        prevLevel = level;
      }
      if (state === 'gameover' && !gameOverFired) {
        gameOverFired = true;
        cbOver.current(score);
      }

      rafId = requestAnimationFrame(loop);
    }

    initGame();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      // also: remove canvas mouse/click listeners and pause() any new Audio(...)
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      }}
    />
  );
}
```

## Notas

- El `useEffect` del loop tiene `[]` a propósito: reiniciar = remontar el componente con `key` desde la play-page.
- `onKeyDown` ignora los eventos cuyo `target` es un `<input>` (diferencia respecto a `AsteroidsGame.tsx`, que hoy
  hace `preventDefault` sobre la barra espaciadora incluso al teclear el nombre en el modal).
- Mantén `width`/`height` del `<canvas>` iguales al tamaño lógico del juego original (Tetris: 300×600 + canvas
  «siguiente» 120×120; Arkanoid: 800×600). Si el juego no es 4:3, ajusta el contenedor `.crt-screen` en la play-page.
