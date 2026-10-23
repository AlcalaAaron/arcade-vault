'use client';

import { useRef } from 'react';

interface FroggerGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COLS = 16;
const ROWS = 14;
const CELL = 40; // px
const CANVAS_W = COLS * CELL; // 640 — se escala con CSS al contenedor
const CANVAS_H = ROWS * CELL; // 560

// Zonas (índice de fila, 0 = arriba)
const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

// ── Types ─────────────────────────────────────────────────────────────────────

type Direction = 'up' | 'down' | 'left' | 'right';

interface Entity {
  col: number;
  width: number;
  type: 'car' | 'truck' | 'log' | 'turtle';
  submerged?: boolean;
  diveOffset?: number; // ms de desfase del ciclo de inmersión (solo tortugas)
}

interface Lane {
  row: number;
  speed: number;
  dir: 1 | -1;
  entities: Entity[];
}

interface Frog {
  col: number;
  row: number;
  animating: boolean;
  animT: number;
  targetCol: number;
  targetRow: number;
}

// ── Lanes ─────────────────────────────────────────────────────────────────────

const TURTLE_VISIBLE_MS = 3000;
const TURTLE_SUBMERGED_MS = 1500;
const SPEED_STEP = 0.15; // +15 % de velocidad por nivel

interface LaneConfig {
  row: number;
  type: Entity['type'];
  width: number; // celdas; uniforme por carril para que los huecos no deriven
  count: number;
  speed: number; // px/frame en el nivel 1
  dir: 1 | -1;
}

const ROAD_LANES: LaneConfig[] = [
  { row: 8, type: 'car', width: 1, count: 3, speed: 4, dir: 1 },
  { row: 9, type: 'truck', width: 3, count: 2, speed: 3, dir: -1 },
  { row: 10, type: 'car', width: 1, count: 4, speed: 2.5, dir: 1 },
  { row: 11, type: 'truck', width: 2, count: 3, speed: 2, dir: -1 },
  { row: 12, type: 'car', width: 1, count: 3, speed: 1.5, dir: 1 },
];

const RIVER_LANES: LaneConfig[] = [
  { row: 1, type: 'log', width: 3, count: 3, speed: 1.75, dir: -1 },
  { row: 2, type: 'log', width: 2, count: 4, speed: 3, dir: 1 },
  { row: 3, type: 'turtle', width: 3, count: 3, speed: 2.5, dir: -1 },
  { row: 4, type: 'log', width: 4, count: 3, speed: 2, dir: 1 },
  { row: 5, type: 'turtle', width: 2, count: 4, speed: 1.5, dir: -1 },
  { row: 6, type: 'log', width: 3, count: 3, speed: 1, dir: 1 },
];

function buildLane(cfg: LaneConfig, level: number): Lane {
  // Cada entidad recorre COLS + width celdas antes de reentrar; repartirlas a
  // intervalos iguales de ese recorrido mantiene los huecos constantes.
  const spacing = (COLS + cfg.width) / cfg.count;
  const offset = (cfg.row * 1.3) % spacing;

  const entities: Entity[] = Array.from({ length: cfg.count }, (_, i) => {
    const entity: Entity = {
      col: -cfg.width + offset + i * spacing,
      width: cfg.width,
      type: cfg.type,
    };
    if (cfg.type === 'turtle') {
      entity.submerged = false;
      entity.diveOffset =
        (i * TURTLE_SUBMERGED_MS) % (TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS);
    }
    return entity;
  });

  return {
    row: cfg.row,
    speed: cfg.speed * (1 + SPEED_STEP) ** (level - 1),
    dir: cfg.dir,
    entities,
  };
}

function buildLanes(level: number): Lane[] {
  return [...RIVER_LANES, ...ROAD_LANES].map((cfg) => buildLane(cfg, level));
}

// ── Component ─────────────────────────────────────────────────────────────────

// Esqueleto del Paso 2: el game loop se añade en los pasos 3–7.
export default function FroggerGame(_props: FroggerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    />
  );
}
