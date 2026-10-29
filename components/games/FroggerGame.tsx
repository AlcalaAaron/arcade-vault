'use client';

import { useEffect, useRef } from 'react';

interface FroggerGameProps {
  paused: boolean;
  skinKey?: string;
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

// ── State ─────────────────────────────────────────────────────────────────────

const JUMP_MS = 120;
const FROG_START_COL = COLS / 2 - 0.5; // centrada entre las columnas 7 y 8
const FROG_HITBOX_MARGIN = 0.15; // celdas, a cada lado
const START_LIVES = 3;
const ROUND_TIME_MS = 15000;
const ROUND_TIME_STEP_MS = 1000; // menos tiempo por nivel
const ROUND_TIME_MIN_MS = 6000;

// 5 bocas de 2 columnas separadas por muros de 1 columna (cols 1-2, 4-5, …)
const GOAL_SLOTS = 5;
const GOAL_WIDTH = 2;
const goalStartCol = (i: number) => 1 + i * 3;

const KEY_DIR: Record<string, Direction> = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
};

const DIR_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const DIR_ANGLE: Record<Direction, number> = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
};

interface GameState {
  frog: Frog;
  facing: Direction;
  lanes: Lane[];
  goals: boolean[]; // boca i ocupada
  level: number;
  score: number;
  lives: number;
  timeLeft: number; // ms
  elapsed: number; // ms de juego, para el ciclo de las tortugas
  pendingDir: Direction | null;
  bestRow: number; // fila más alta alcanzada por la rana actual (puntos por avance)
}

function roundTimeMs(level: number): number {
  return Math.max(
    ROUND_TIME_MIN_MS,
    ROUND_TIME_MS - (level - 1) * ROUND_TIME_STEP_MS,
  );
}

function newFrog(): Frog {
  return {
    col: FROG_START_COL,
    row: ROW_START,
    animating: false,
    animT: 0,
    targetCol: FROG_START_COL,
    targetRow: ROW_START,
  };
}

function initialState(): GameState {
  return {
    frog: newFrog(),
    facing: 'up',
    lanes: buildLanes(1),
    goals: Array.from({ length: GOAL_SLOTS }, () => false),
    level: 1,
    score: 0,
    lives: START_LIVES,
    timeLeft: roundTimeMs(1),
    elapsed: 0,
    pendingDir: null,
    bestRow: ROW_START,
  };
}

// Rana nueva en la salida con el temporizador completo. Muta el objeto
// existente para no dejar referencias obsoletas en el loop.
function respawnFrog(s: GameState) {
  Object.assign(s.frog, newFrog());
  s.facing = 'up';
  s.pendingDir = null;
  s.timeLeft = roundTimeMs(s.level);
  s.bestRow = ROW_START;
}

function isRiverRow(row: number): boolean {
  return row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT;
}

function isRoadRow(row: number): boolean {
  return row >= ROW_ROAD_TOP && row <= ROW_ROAD_BOT;
}

// Entidad del río que sostiene a la rana (su centro cae sobre ella), o null.
// Las tortugas sumergidas no sostienen.
function getSupport(frog: Frog, lanes: Lane[]): Entity | null {
  const lane = lanes.find((l) => l.row === frog.row);
  if (!lane) return null;
  const center = frog.col + 0.5;
  return (
    lane.entities.find(
      (e) =>
        (e.type === 'log' || e.type === 'turtle') &&
        !e.submerged &&
        center >= e.col &&
        center < e.col + e.width,
    ) ?? null
  );
}

// ¿Algún vehículo solapa a la rana en su carril? La hitbox de la rana es algo
// más estrecha que la celda para que los roces no sean letales.
function checkRoadCollision(frog: Frog, lanes: Lane[]): boolean {
  if (!isRoadRow(frog.row)) return false;
  const lane = lanes.find((l) => l.row === frog.row);
  if (!lane) return false;
  const left = frog.col + FROG_HITBOX_MARGIN;
  const right = frog.col + 1 - FROG_HITBOX_MARGIN;
  return lane.entities.some(
    (e) =>
      (e.type === 'car' || e.type === 'truck') &&
      left < e.col + e.width &&
      right > e.col,
  );
}

// Índice de la boca libre bajo la rana, o -1 si no hay boca o ya está
// ocupada (en ambos casos la rana muere).
function checkGoal(frog: Frog, goals: boolean[]): number {
  if (frog.row !== ROW_GOALS) return -1;
  const col = Math.round(frog.col);
  for (let i = 0; i < GOAL_SLOTS; i++) {
    const start = goalStartCol(i);
    if (col >= start && col < start + GOAL_WIDTH) return goals[i] ? -1 : i;
  }
  return -1;
}

function updateTurtles(lanes: Lane[], elapsed: number) {
  const cycle = TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS;
  for (const lane of lanes) {
    for (const e of lane.entities) {
      if (e.type !== 'turtle') continue;
      e.submerged =
        (elapsed + (e.diveOffset ?? 0)) % cycle >= TURTLE_VISIBLE_MS;
    }
  }
}

// ── Drawing ───────────────────────────────────────────────────────────────────

type Skin = {
  name: string;
  /** Fondo del canvas (neon: negro puro). null = no se rellena. */
  boardBg: string | null;
  /** Zonas; null = se deja ver boardBg. */
  safe: string | null;
  river: string | null;
  road: string | null;
  goal: string;
  gold: string;
  /** Bordes brillantes entre zonas (solo neon). */
  zoneLine: string | null;
  laneLine: string;
  frog: string;
  frogDark: string;
  frogGoal: string;
  frogGoalLeg: string;
  carColors: string[];
  truckCargo: string;
  truckCargoStroke: string | null;
  truckCab: string;
  glass: string;
  wheel: string;
  log: string;
  logGrain: string;
  turtle: string;
  turtleDark: string;
  turtleSubmerged: string;
  hudBg: string;
  hudText: string;
  timeHigh: string;
  timeMid: string;
  timeLow: string;
  /** shadowBlur para glow; 0 = sin glow. */
  glow: number;
  drawBody: (
    ctx: CanvasRenderingContext2D,
    color: string,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) => void;
};

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function setGlow(ctx: CanvasRenderingContext2D, color: string, blur: number) {
  if (blur <= 0) return;
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
}

function clearGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

// Cuerpo liso con esquinas redondeadas (paleta arcade original)
function drawBodyClassic(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// Bloque sólido CRT con línea de luz de 4px en el tope, sin glow
function drawBodyRetro(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, 2));
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x + 1, y + 1, w - 2, 4);
}

// Relleno translúcido + contorno brillante con glow
function drawBodyNeon(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  setGlow(ctx, color, 14);
  ctx.fillStyle = withAlpha(color, 0.4);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.restore();
}

const SKINS: Record<string, Skin> = {
  classic: {
    name: 'Classic',
    boardBg: null,
    safe: '#0d3b1e',
    river: '#0a1f4a',
    road: '#0b0b10',
    goal: '#2f9e57',
    gold: '#f5c518',
    zoneLine: null,
    laneLine: 'rgba(255,255,255,0.25)',
    frog: '#39ff14',
    frogDark: '#1fa80c',
    frogGoal: '#1fa80c',
    frogGoalLeg: '#0f6e06',
    carColors: ['#e63946', '#f4c20d', '#3a86ff'],
    truckCargo: '#b8bec6',
    truckCargoStroke: '#7b828b',
    truckCab: '#4a6fa5',
    glass: 'rgba(200,230,255,0.85)',
    wheel: '#111111',
    log: '#7a4a21',
    logGrain: '#4e2c10',
    turtle: '#2e9e4a',
    turtleDark: '#1b6b30',
    turtleSubmerged: 'rgba(46,158,74,0.35)',
    hudBg: 'rgba(0,0,0,0.55)',
    hudText: '#ffffff',
    timeHigh: '#39ff14',
    timeMid: '#f4c20d',
    timeLow: '#e63946',
    glow: 0,
    drawBody: drawBodyClassic,
  },
  retro: {
    name: 'Retro',
    boardBg: null,
    safe: '#3f7a52',
    river: '#355fa8',
    road: '#3a3a4c',
    goal: '#81c784',
    gold: '#ffd54f',
    zoneLine: null,
    laneLine: 'rgba(255,255,255,0.4)',
    frog: '#aed581',
    frogDark: '#689f38',
    frogGoal: '#c5e1a5',
    frogGoalLeg: '#7cb342',
    carColors: ['#e57373', '#ffd54f', '#64b5f6'],
    truckCargo: '#cfd8dc',
    truckCargoStroke: '#90a4ae',
    truckCab: '#7986cb',
    glass: 'rgba(255,255,255,0.6)',
    wheel: '#263238',
    log: '#b07a4f',
    logGrain: '#7a4f2d',
    turtle: '#66bb6a',
    turtleDark: '#388e3c',
    turtleSubmerged: 'rgba(165,214,167,0.4)',
    hudBg: 'rgba(20,20,30,0.7)',
    hudText: '#fff8e1',
    timeHigh: '#aed581',
    timeMid: '#ffd54f',
    timeLow: '#e57373',
    glow: 0,
    drawBody: drawBodyRetro,
  },
  neon: {
    name: 'Neon',
    boardBg: '#000000',
    safe: null,
    river: '#00103a',
    road: null,
    goal: '#00ff66',
    gold: '#ffff00',
    zoneLine: '#00ffff',
    laneLine: 'rgba(0,255,255,0.35)',
    frog: '#39ff14',
    frogDark: '#00ff99',
    frogGoal: '#00ffaa',
    frogGoalLeg: '#00cc88',
    carColors: ['#ff0040', '#ffff00', '#00aaff'],
    truckCargo: '#ff00ff',
    truckCargoStroke: null,
    truckCab: '#00ffff',
    glass: 'rgba(255,255,255,0.9)',
    wheel: '#ffffff',
    log: '#ff8000',
    logGrain: 'rgba(255,128,0,0.7)',
    turtle: '#00ff66',
    turtleDark: '#003d1a',
    turtleSubmerged: 'rgba(0,255,102,0.35)',
    hudBg: 'rgba(0,0,0,0.75)',
    hudText: '#00ffff',
    timeHigh: '#00ff66',
    timeMid: '#ffff00',
    timeLow: '#ff0040',
    glow: 14,
    drawBody: drawBodyNeon,
  },
};

function drawBackground(ctx: CanvasRenderingContext2D, skin: Skin) {
  const rows = (top: number, bottom: number) => (bottom - top + 1) * CELL;

  if (skin.boardBg) {
    ctx.fillStyle = skin.boardBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  if (skin.safe) {
    ctx.fillStyle = skin.safe;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  if (skin.river) {
    ctx.fillStyle = skin.river;
    ctx.fillRect(
      0,
      ROW_RIVER_TOP * CELL,
      CANVAS_W,
      rows(ROW_RIVER_TOP, ROW_RIVER_BOT),
    );
  }

  if (skin.road) {
    ctx.fillStyle = skin.road;
    ctx.fillRect(
      0,
      ROW_ROAD_TOP * CELL,
      CANVAS_W,
      rows(ROW_ROAD_TOP, ROW_ROAD_BOT),
    );
  }

  // Bordes brillantes entre zonas (neon)
  if (skin.zoneLine) {
    ctx.save();
    setGlow(ctx, skin.zoneLine, skin.glow);
    ctx.strokeStyle = skin.zoneLine;
    ctx.lineWidth = 2;
    for (const row of [
      ROW_RIVER_TOP,
      ROW_RIVER_BOT + 1,
      ROW_ROAD_TOP,
      ROW_ROAD_BOT + 1,
    ]) {
      ctx.beginPath();
      ctx.moveTo(0, row * CELL);
      ctx.lineTo(CANVAS_W, row * CELL);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Líneas discontinuas entre carriles de carretera
  ctx.strokeStyle = skin.laneLine;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 12]);
  for (let r = ROW_ROAD_TOP + 1; r <= ROW_ROAD_BOT; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(CANVAS_W, r * CELL);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawFrogShape(
  ctx: CanvasRenderingContext2D,
  skin: Skin,
  jumping: boolean,
  color: string,
  legColor: string,
) {
  // Dibujada mirando hacia arriba, centrada en el origen
  ctx.save();
  setGlow(ctx, color, skin.glow);
  ctx.fillStyle = legColor;
  const spread = jumping ? 1 : 0.55;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      side * 13 * spread + side * 3,
      9 * spread + 3,
      5,
      8,
      side * 0.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      side * 12 * spread + side * 3,
      -8 * spread - 1,
      4,
      6,
      -side * 0.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  clearGlow(ctx);
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(side * 7, -8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(side * 7, -9, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGoals(
  ctx: CanvasRenderingContext2D,
  skin: Skin,
  goals: boolean[],
) {
  for (let i = 0; i < GOAL_SLOTS; i++) {
    const x = goalStartCol(i) * CELL;
    const w = GOAL_WIDTH * CELL;
    skin.drawBody(ctx, skin.goal, x, 0, w, CELL, 0);
    ctx.save();
    setGlow(ctx, skin.gold, skin.glow);
    ctx.strokeStyle = skin.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, 1, w - 2, CELL - 2);
    ctx.restore();

    if (goals[i]) {
      ctx.save();
      ctx.translate(x + w / 2, CELL / 2);
      drawFrogShape(ctx, skin, false, skin.frogGoal, skin.frogGoalLeg);
      ctx.restore();
    }
  }
}

function drawWheels(
  ctx: CanvasRenderingContext2D,
  skin: Skin,
  xs: number[],
  y: number,
  h: number,
) {
  ctx.fillStyle = skin.wheel;
  for (const wx of xs) {
    for (const wy of [y, y + h]) {
      ctx.beginPath();
      ctx.arc(wx, wy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  skin: Skin,
  lane: Lane,
  e: Entity,
  index: number,
) {
  const x = e.col * CELL + 3;
  const w = e.width * CELL - 6;
  const y = lane.row * CELL + 7;
  const h = CELL - 14;

  skin.drawBody(
    ctx,
    skin.carColors[(lane.row + index) % skin.carColors.length],
    x,
    y,
    w,
    h,
    5,
  );

  ctx.fillStyle = skin.glass;
  ctx.fillRect(lane.dir === 1 ? x + w - 14 : x + 5, y + 4, 9, h - 8);

  drawWheels(ctx, skin, [x + 9, x + w - 9], y, h);
}

function drawTruck(
  ctx: CanvasRenderingContext2D,
  skin: Skin,
  lane: Lane,
  e: Entity,
) {
  const x = e.col * CELL + 3;
  const w = e.width * CELL - 6;
  const y = lane.row * CELL + 6;
  const h = CELL - 12;
  const cabW = CELL - 6;
  const cabX = lane.dir === 1 ? x + w - cabW : x;
  const cargoX = lane.dir === 1 ? x : x + cabW;
  const cargoW = w - cabW;

  skin.drawBody(ctx, skin.truckCargo, cargoX, y, cargoW, h, 0);
  if (skin.truckCargoStroke) {
    ctx.strokeStyle = skin.truckCargoStroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(cargoX + 0.5, y + 0.5, cargoW - 1, h - 1);
  }

  skin.drawBody(ctx, skin.truckCab, cabX, y, cabW, h, 5);

  ctx.fillStyle = skin.glass;
  ctx.fillRect(lane.dir === 1 ? cabX + cabW - 11 : cabX + 4, y + 4, 8, h - 8);

  drawWheels(
    ctx,
    skin,
    [cabX + cabW / 2, cargoX + 9, cargoX + cargoW - 9],
    y,
    h,
  );
}

function drawLog(
  ctx: CanvasRenderingContext2D,
  skin: Skin,
  lane: Lane,
  e: Entity,
) {
  const x = e.col * CELL + 2;
  const w = e.width * CELL - 4;
  const y = lane.row * CELL + 6;
  const h = CELL - 12;

  skin.drawBody(ctx, skin.log, x, y, w, h, 7);

  ctx.strokeStyle = skin.logGrain;
  ctx.lineWidth = 2;
  for (let lx = x + 12; lx < x + w - 8; lx += 16) {
    ctx.beginPath();
    ctx.moveTo(lx, y + 5);
    ctx.lineTo(lx, y + h - 5);
    ctx.stroke();
  }
}

function drawTurtle(
  ctx: CanvasRenderingContext2D,
  skin: Skin,
  lane: Lane,
  e: Entity,
) {
  for (let k = 0; k < e.width; k++) {
    const cx = (e.col + k + 0.5) * CELL;
    const cy = (lane.row + 0.5) * CELL;

    if (e.submerged) {
      ctx.strokeStyle = skin.turtleSubmerged;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }

    ctx.save();
    setGlow(ctx, skin.turtle, skin.glow);
    ctx.fillStyle = skin.turtle;
    ctx.beginPath();
    ctx.arc(cx - lane.dir * 2, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + lane.dir * 15, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Escamas
    ctx.strokeStyle = skin.turtleDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx - lane.dir * 2, cy, 8, 0, Math.PI * 2);
    ctx.moveTo(cx - lane.dir * 2 - 14, cy);
    ctx.lineTo(cx - lane.dir * 2 + 14, cy);
    ctx.moveTo(cx - lane.dir * 2, cy - 14);
    ctx.lineTo(cx - lane.dir * 2, cy + 14);
    ctx.stroke();
  }
}

function drawEntity(
  ctx: CanvasRenderingContext2D,
  skin: Skin,
  lane: Lane,
  e: Entity,
  index: number,
) {
  if (e.type === 'car') drawCar(ctx, skin, lane, e, index);
  else if (e.type === 'truck') drawTruck(ctx, skin, lane, e);
  else if (e.type === 'log') drawLog(ctx, skin, lane, e);
  else drawTurtle(ctx, skin, lane, e);
}

function drawFrog(ctx: CanvasRenderingContext2D, skin: Skin, s: GameState) {
  const { frog } = s;
  const t = frog.animating ? Math.min(frog.animT / JUMP_MS, 1) : 0;
  const col = frog.col + (frog.targetCol - frog.col) * t;
  const row = frog.row + (frog.targetRow - frog.row) * t;

  ctx.save();
  ctx.translate((col + 0.5) * CELL, (row + 0.5) * CELL);
  ctx.rotate(DIR_ANGLE[s.facing]);
  drawFrogShape(ctx, skin, frog.animating, skin.frog, skin.frogDark);
  ctx.restore();
}

// El HUD se superpone a la fila de metas: franja translúcida arriba y barra
// de tiempo pegada al borde inferior de la fila 0.
function drawHud(ctx: CanvasRenderingContext2D, skin: Skin, s: GameState) {
  ctx.fillStyle = skin.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, 22);

  ctx.save();
  setGlow(ctx, skin.hudText, skin.glow / 2);
  ctx.fillStyle = skin.hudText;
  ctx.font = 'bold 16px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(`PUNTOS ${s.score}`, 8, 11);
  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${s.level}`, CANVAS_W / 2, 11);
  ctx.restore();

  ctx.save();
  setGlow(ctx, skin.frog, skin.glow / 2);
  ctx.fillStyle = skin.frog;
  for (let i = 0; i < s.lives; i++) {
    ctx.beginPath();
    ctx.arc(CANVAS_W - 14 - i * 20, 11, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const ratio = Math.max(0, s.timeLeft / roundTimeMs(s.level));
  const barColor =
    ratio > 0.5 ? skin.timeHigh : ratio > 0.25 ? skin.timeMid : skin.timeLow;
  ctx.save();
  setGlow(ctx, barColor, skin.glow / 2);
  ctx.fillStyle = barColor;
  ctx.fillRect(0, CELL - 4, CANVAS_W * ratio, 4);
  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FroggerGame({
  paused,
  skinKey = 'classic',
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: FroggerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const stateRef = useRef<GameState>(initialState());
  const skinRef = useRef<Skin>(SKINS[skinKey] ?? SKINS.classic);

  // Re-sync skin so the loop reads the latest value without re-mounting.
  useEffect(() => {
    skinRef.current = SKINS[skinKey] ?? SKINS.classic;
  }, [skinKey]);

  // Sync paused ref so the loop reads the latest value without re-mounting.
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let prevScore = 0;
    let prevLives = START_LIVES;
    let prevLevel = 1;
    let over = false;
    let raf = 0;
    let last = performance.now();

    // ── Callbacks ───────────────────────────────────────────────────────────
    // Notifica solo los valores que cambiaron desde la última llamada.
    function syncCallbacks() {
      const s = stateRef.current;
      if (s.score !== prevScore) {
        prevScore = s.score;
        onScoreChange(s.score);
      }
      if (s.lives !== prevLives) {
        prevLives = s.lives;
        onLivesChange(s.lives);
      }
      if (s.level !== prevLevel) {
        prevLevel = s.level;
        onLevelChange(s.level);
      }
    }

    // ── Muerte ──────────────────────────────────────────────────────────────
    function killFrog() {
      if (over) return;
      const s = stateRef.current;
      s.lives -= 1;

      if (s.lives > 0) {
        respawnFrog(s); // onLivesChange se dispara en update()
        return;
      }

      // Última vida: onLivesChange(0) siempre antes que onGameOver
      over = true;
      syncCallbacks();
      onGameOver(s.score);
    }

    // ── Ronda completada ────────────────────────────────────────────────────
    // onLevelChange se dispara en update() al detectar el cambio de nivel.
    function completeRound() {
      const s = stateRef.current;
      s.score += 200;
      s.level += 1;
      // Se mutan en su sitio: update() conserva referencias a estos arrays
      s.lanes.splice(0, s.lanes.length, ...buildLanes(s.level));
      s.goals.fill(false);
      respawnFrog(s); // posición inicial y temporizador del nuevo nivel
    }

    // ── Aterrizaje ──────────────────────────────────────────────────────────
    // Puntos por avance y resolución de la fila de metas. Los peligros de
    // carretera y río se comprueban cada frame en update().
    function resolveLanding() {
      const s = stateRef.current;
      const { frog } = s;

      if (frog.row < s.bestRow) {
        s.score += 10 * (s.bestRow - frog.row);
        s.bestRow = frog.row;
      }
      if (frog.row !== ROW_GOALS) return;

      const slot = checkGoal(frog, s.goals);
      if (slot < 0) {
        killFrog();
        return;
      }
      s.goals[slot] = true;
      s.score += 50 + Math.floor(s.timeLeft / 1000) * 10;
      respawnFrog(s);
      if (s.goals.every(Boolean)) completeRound();
    }

    // ── Input ───────────────────────────────────────────────────────────────
    function startJump(s: GameState, dir: Direction) {
      const { frog } = s;
      const { dx, dy } = DIR_DELTA[dir];
      s.facing = dir;

      const row = frog.row + dy;
      let col = frog.col + dx;
      if (row < ROW_GOALS || row > ROW_START || col < 0 || col > COLS - 1)
        return;
      // Fuera del río la rana vuelve a la cuadrícula entera
      if (!isRiverRow(row)) col = Math.round(col);

      frog.animating = true;
      frog.animT = 0;
      frog.targetCol = col;
      frog.targetRow = row;
    }

    function handleKey(e: KeyboardEvent) {
      const dir = KEY_DIR[e.key.toLowerCase()];
      if (!dir) return;
      e.preventDefault();
      if (e.repeat || pausedRef.current) return;
      stateRef.current.pendingDir = dir;
    }

    // ── Update ──────────────────────────────────────────────────────────────
    function update(dt: number) {
      const s = stateRef.current;
      const { frog, lanes } = s;

      s.elapsed += dt;
      updateTurtles(lanes, s.elapsed);

      // Salto: iniciar si hay dirección pendiente, o avanzar la animación
      if (!frog.animating && s.pendingDir) {
        startJump(s, s.pendingDir);
        s.pendingDir = null;
      }
      if (frog.animating) {
        frog.animT += dt;
        if (frog.animT >= JUMP_MS) {
          frog.col = frog.targetCol;
          frog.row = frog.targetRow;
          frog.animating = false;
          frog.animT = 0;
          resolveLanding();
        }
      }

      // Soporte en el río, evaluado antes de mover las entidades
      const riding =
        !frog.animating && isRiverRow(frog.row)
          ? getSupport(frog, lanes)
          : null;

      for (const lane of lanes) {
        const delta = (lane.speed * lane.dir * dt) / 16 / CELL; // px/frame → celdas
        const loop = COLS + lane.entities[0].width;
        for (const e of lane.entities) {
          e.col += delta;
          // Reentrada por el lado opuesto conservando el desfase exacto
          if (lane.dir === 1 && e.col >= COLS) e.col -= loop;
          else if (lane.dir === -1 && e.col <= -e.width) e.col += loop;
        }
        if (riding && lane.row === frog.row) {
          frog.col += delta;
          const center = frog.col + 0.5;
          if (center < 0 || center > COLS) killFrog();
        }
      }

      // Peligros: vehículo en la carretera, agua (sin soporte) en el río
      if (!frog.animating) {
        if (checkRoadCollision(frog, lanes)) killFrog();
        else if (isRiverRow(frog.row) && !getSupport(frog, lanes)) killFrog();
      }

      s.timeLeft -= dt;
      if (s.timeLeft <= 0) {
        s.timeLeft = 0;
        killFrog();
      }

      syncCallbacks();
    }

    // ── Draw ────────────────────────────────────────────────────────────────
    function draw() {
      const s = stateRef.current;
      const skin = skinRef.current;
      drawBackground(ctx, skin);
      drawGoals(ctx, skin, s.goals);
      for (const lane of s.lanes) {
        lane.entities.forEach((e, i) => drawEntity(ctx, skin, lane, e, i));
      }
      drawFrog(ctx, skin, s);
      drawHud(ctx, skin, s);
    }

    // ── Loop ────────────────────────────────────────────────────────────────
    function frame(now: number) {
      const dt = Math.min(now - last, 50); // evita saltos tras cambiar de pestaña
      last = now;
      if (!pausedRef.current) update(dt);
      draw();
      if (!over) raf = requestAnimationFrame(frame); // game over detiene el loop
    }

    document.addEventListener('keydown', handleKey);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    />
  );
}
