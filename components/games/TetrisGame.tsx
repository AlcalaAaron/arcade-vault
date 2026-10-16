'use client';

import { useEffect, useRef } from 'react';

interface TetrisGameProps {
  paused: boolean;
  startLevel: number; // 1–15; se lee al montar, cambiarlo exige remontar con `key`
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void; // 1 al empezar, 0 al terminar
  onLevelChange: (level: number) => void;
  onPauseToggle: () => void; // P o Esc
  onGameOver: (finalScore: number) => void;
}

export default function TetrisGame({
  paused,
  startLevel,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onPauseToggle,
  onGameOver,
}: TetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // startLevel is only read on mount: changing it requires remounting with `key`
  const startLevelRef = useRef(Math.min(15, Math.max(1, startLevel)));

  // Refs so the game loop always reads the latest prop values without re-running the effect
  const pausedRef = useRef(paused);
  const cbScore = useRef(onScoreChange);
  const cbLives = useRef(onLivesChange);
  const cbLevel = useRef(onLevelChange);
  const cbPause = useRef(onPauseToggle);
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
    cbPause.current = onPauseToggle;
  }, [onPauseToggle]);
  useEffect(() => {
    cbOver.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const W = 800;
    const H = 600;

    // ── Game state ───────────────────────────────────────────────────────────
    let score: number, lives: number, level: number;
    let state: 'playing' | 'gameover';
    let gameOverFired = false;

    // Previous values to avoid spamming callbacks
    let prevScore = -1,
      prevLives = -1,
      prevLevel = -1;

    function initGame() {
      score = 0;
      lives = 1;
      level = startLevelRef.current;
      state = 'playing';
      gameOverFired = false;
      prevScore = -1;
      prevLives = -1;
      prevLevel = -1;
    }

    // ── Update ───────────────────────────────────────────────────────────────
    function update(dt: number) {
      void dt;
    }

    // ── Draw ─────────────────────────────────────────────────────────────────
    function draw() {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
    }

    // ── Loop ─────────────────────────────────────────────────────────────────
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
