'use client';

import { useEffect, useRef } from 'react';

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
    (e) => (e.type === 'car' || e.type === 'truck') && left < e.col + e.width && right > e.col,
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
      e.submerged = (elapsed + (e.diveOffset ?? 0)) % cycle >= TURTLE_VISIBLE_MS;
    }
  }
}

// ── Drawing ───────────────────────────────────────────────────────────────────

const COLOR_ROAD = '#0b0b10';
const COLOR_RIVER = '#0a1f4a';
const COLOR_SAFE = '#0d3b1e';
const COLOR_GOAL = '#2f9e57';
const COLOR_GOLD = '#f5c518';
const COLOR_FROG = '#39ff14';
const COLOR_FROG_DARK = '#1fa80c';
const CAR_COLORS = ['#e63946', '#f4c20d', '#3a86ff'];

function drawBackground(ctx: CanvasRenderingContext2D) {
  const rows = (top: number, bottom: number) => (bottom - top + 1) * CELL;

  ctx.fillStyle = COLOR_SAFE;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = COLOR_RIVER;
  ctx.fillRect(
    0,
    ROW_RIVER_TOP * CELL,
    CANVAS_W,
    rows(ROW_RIVER_TOP, ROW_RIVER_BOT),
  );

  ctx.fillStyle = COLOR_ROAD;
  ctx.fillRect(
    0,
    ROW_ROAD_TOP * CELL,
    CANVAS_W,
    rows(ROW_ROAD_TOP, ROW_ROAD_BOT),
  );

  // Líneas discontinuas entre carriles de carretera
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
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
  jumping: boolean,
  color: string,
  legColor: string,
) {
  // Dibujada mirando hacia arriba, centrada en el origen
  ctx.fillStyle = legColor;
  const spread = jumping ? 1 : 0.55;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 13 * spread + side * 3, 9 * spread + 3, 5, 8, side * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(side * 12 * spread + side * 3, -8 * spread - 1, 4, 6, -side * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();

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
}

function drawGoals(ctx: CanvasRenderingContext2D, goals: boolean[]) {
  for (let i = 0; i < GOAL_SLOTS; i++) {
    const x = goalStartCol(i) * CELL;
    const w = GOAL_WIDTH * CELL;
    ctx.fillStyle = COLOR_GOAL;
    ctx.fillRect(x, 0, w, CELL);
    ctx.strokeStyle = COLOR_GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, 1, w - 2, CELL - 2);

    if (goals[i]) {
      ctx.save();
      ctx.translate(x + w / 2, CELL / 2);
      drawFrogShape(ctx, false, COLOR_FROG_DARK, '#0f6e06');
      ctx.restore();
    }
  }
}

function drawWheels(
  ctx: CanvasRenderingContext2D,
  xs: number[],
  y: number,
  h: number,
) {
  ctx.fillStyle = '#111111';
  for (const wx of xs) {
    for (const wy of [y, y + h]) {
      ctx.beginPath();
      ctx.arc(wx, wy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCar(ctx: CanvasRenderingContext2D, lane: Lane, e: Entity, index: number) {
  const x = e.col * CELL + 3;
  const w = e.width * CELL - 6;
  const y = lane.row * CELL + 7;
  const h = CELL - 14;

  ctx.fillStyle = CAR_COLORS[(lane.row + index) % CAR_COLORS.length];
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 5);
  ctx.fill();

  ctx.fillStyle = 'rgba(200,230,255,0.85)';
  ctx.fillRect(lane.dir === 1 ? x + w - 14 : x + 5, y + 4, 9, h - 8);

  drawWheels(ctx, [x + 9, x + w - 9], y, h);
}

function drawTruck(ctx: CanvasRenderingContext2D, lane: Lane, e: Entity) {
  const x = e.col * CELL + 3;
  const w = e.width * CELL - 6;
  const y = lane.row * CELL + 6;
  const h = CELL - 12;
  const cabW = CELL - 6;
  const cabX = lane.dir === 1 ? x + w - cabW : x;
  const cargoX = lane.dir === 1 ? x : x + cabW;
  const cargoW = w - cabW;

  ctx.fillStyle = '#b8bec6';
  ctx.fillRect(cargoX, y, cargoW, h);
  ctx.strokeStyle = '#7b828b';
  ctx.lineWidth = 1;
  ctx.strokeRect(cargoX + 0.5, y + 0.5, cargoW - 1, h - 1);

  ctx.fillStyle = '#4a6fa5';
  ctx.beginPath();
  ctx.roundRect(cabX, y, cabW, h, 5);
  ctx.fill();

  ctx.fillStyle = 'rgba(200,230,255,0.85)';
  ctx.fillRect(lane.dir === 1 ? cabX + cabW - 11 : cabX + 4, y + 4, 8, h - 8);

  drawWheels(ctx, [cabX + cabW / 2, cargoX + 9, cargoX + cargoW - 9], y, h);
}

function drawLog(ctx: CanvasRenderingContext2D, lane: Lane, e: Entity) {
  const x = e.col * CELL + 2;
  const w = e.width * CELL - 4;
  const y = lane.row * CELL + 6;
  const h = CELL - 12;

  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.fill();

  ctx.strokeStyle = '#4e2c10';
  ctx.lineWidth = 2;
  for (let lx = x + 12; lx < x + w - 8; lx += 16) {
    ctx.beginPath();
    ctx.moveTo(lx, y + 5);
    ctx.lineTo(lx, y + h - 5);
    ctx.stroke();
  }
}

function drawTurtle(ctx: CanvasRenderingContext2D, lane: Lane, e: Entity) {
  for (let k = 0; k < e.width; k++) {
    const cx = (e.col + k + 0.5) * CELL;
    const cy = (lane.row + 0.5) * CELL;

    if (e.submerged) {
      ctx.strokeStyle = 'rgba(46,158,74,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }

    ctx.fillStyle = '#2e9e4a';
    ctx.beginPath();
    ctx.arc(cx - lane.dir * 2, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + lane.dir * 15, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Escamas
    ctx.strokeStyle = '#1b6b30';
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
  lane: Lane,
  e: Entity,
  index: number,
) {
  if (e.type === 'car') drawCar(ctx, lane, e, index);
  else if (e.type === 'truck') drawTruck(ctx, lane, e);
  else if (e.type === 'log') drawLog(ctx, lane, e);
  else drawTurtle(ctx, lane, e);
}

function drawFrog(ctx: CanvasRenderingContext2D, s: GameState) {
  const { frog } = s;
  const t = frog.animating ? Math.min(frog.animT / JUMP_MS, 1) : 0;
  const col = frog.col + (frog.targetCol - frog.col) * t;
  const row = frog.row + (frog.targetRow - frog.row) * t;

  ctx.save();
  ctx.translate((col + 0.5) * CELL, (row + 0.5) * CELL);
  ctx.rotate(DIR_ANGLE[s.facing]);
  drawFrogShape(ctx, frog.animating, COLOR_FROG, COLOR_FROG_DARK);
  ctx.restore();
}

// El HUD se superpone a la fila de metas: franja translúcida arriba y barra
// de tiempo pegada al borde inferior de la fila 0.
function drawHud(ctx: CanvasRenderingContext2D, s: GameState) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, 22);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(`PUNTOS ${s.score}`, 8, 11);
  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${s.level}`, CANVAS_W / 2, 11);

  ctx.fillStyle = COLOR_FROG;
  for (let i = 0; i < s.lives; i++) {
    ctx.beginPath();
    ctx.arc(CANVAS_W - 14 - i * 20, 11, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const ratio = Math.max(0, s.timeLeft / roundTimeMs(s.level));
  ctx.fillStyle = ratio > 0.5 ? COLOR_FROG : ratio > 0.25 ? '#f4c20d' : '#e63946';
  ctx.fillRect(0, CELL - 4, CANVAS_W * ratio, 4);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FroggerGame({
  paused,
  onScoreChange,
  onLivesChange,
  onLevelChange,
}: FroggerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const stateRef = useRef<GameState>(initialState());

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
    let raf = 0;
    let last = performance.now();

    // ── Hook del Paso 7 ─────────────────────────────────────────────────────
    // Paso 7: pérdida de vida, reinicio de posición y game over.
    function killFrog() {}

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
      if (row < ROW_GOALS || row > ROW_START || col < 0 || col > COLS - 1) return;
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
        !frog.animating && isRiverRow(frog.row) ? getSupport(frog, lanes) : null;

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

    // ── Draw ────────────────────────────────────────────────────────────────
    function draw() {
      const s = stateRef.current;
      drawBackground(ctx);
      drawGoals(ctx, s.goals);
      for (const lane of s.lanes) {
        lane.entities.forEach((e, i) => drawEntity(ctx, lane, e, i));
      }
      drawFrog(ctx, s);
      drawHud(ctx, s);
    }

    // ── Loop ────────────────────────────────────────────────────────────────
    function frame(now: number) {
      const dt = Math.min(now - last, 50); // evita saltos tras cambiar de pestaña
      last = now;
      if (!pausedRef.current) update(dt);
      draw();
      raf = requestAnimationFrame(frame);
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
