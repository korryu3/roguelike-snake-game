import { CONFIG } from "../config";
import { pick } from "./rng";
import { WALL_PATTERNS } from "./wallPatterns";
import type { Cell, Direction, Game, RngState, RunSetup, StageState, StepResult } from "./types";

const CENTER: Cell = { x: Math.floor(CONFIG.boardSize / 2), y: Math.floor(CONFIG.boardSize / 2) };

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

const ALL_CELLS: readonly Cell[] = Array.from({ length: CONFIG.boardSize ** 2 }, (_, i) => ({
  x: i % CONFIG.boardSize,
  y: Math.floor(i / CONFIG.boardSize),
}));

function spawnOnFreeCell(rng: RngState, occupied: readonly Cell[]): [Cell, RngState] {
  const blocked = [...occupied, CENTER];
  return pick(rng, ALL_CELLS.filter((c) => !blocked.some((b) => sameCell(b, c))));
}

export function startRun(seed: number, setup: RunSetup = {}): Game {
  const [patternWalls, rngAfterWalls] = pick(seed, WALL_PATTERNS);
  const walls = setup.walls ?? patternWalls;
  const body: StageState["body"] = [CENTER];
  const [spawned, rng] = spawnOnFreeCell(rngAfterWalls, [...walls, ...body]);
  return {
    phase: "awaitingStart",
    run: {
      length: setup.length ?? CONFIG.initialLength,
      hp: setup.hp ?? CONFIG.initialHp,
      pp: 0,
      totalPp: 0,
      score: 0,
      modules: setup.modules ?? [],
      stageNumber: 1,
      rng,
    },
    stage: {
      body,
      walls,
      battery: setup.battery ?? spawned,
      goal: setup.goal ?? null,
      hearts: [],
      remainingMs: CONFIG.timeLimitMs,
      batteriesEaten: setup.batteriesEaten ?? 0,
    },
  };
}

const DELTA: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const neighbor = (cell: Cell, direction: Direction): Cell => ({
  x: cell.x + DELTA[direction].x,
  y: cell.y + DELTA[direction].y,
});

type Playing = Extract<Game, { phase: "playing" }>;

export function step(game: Game, input: readonly Direction[], elapsedMs: number): StepResult {
  switch (game.phase) {
    case "awaitingStart":
      return { game: startPlaying(game, input), events: [] };
    case "playing":
      return { game: advance(enqueue(game, input), elapsedMs), events: [] };
    default:
      return { game, events: [] };
  }
}

function startPlaying(game: Extract<Game, { phase: "awaitingStart" }>, input: readonly Direction[]): Game {
  const [first] = input;
  if (first === undefined) return game;
  return {
    phase: "playing",
    run: game.run,
    stage: game.stage,
    movement: { direction: first, queuedInputs: [], motion: { kind: "moving", sinceLastMoveMs: 0 }, invincibleMs: 0 },
  };
}

const OPPOSITE: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };

function enqueue(game: Playing, input: readonly Direction[]): Playing {
  const queuedInputs = input.reduce<readonly Direction[]>((queue, direction) => {
    const last = queue.at(-1) ?? game.movement.direction;
    if (queue.length >= CONFIG.inputQueueLimit || direction === OPPOSITE[last]) return queue;
    return [...queue, direction];
  }, game.movement.queuedInputs);
  return { ...game, movement: { ...game.movement, queuedInputs } };
}

function advance(game: Playing, elapsedMs: number): Playing {
  const timed: Playing = { ...game, stage: { ...game.stage, remainingMs: game.stage.remainingMs - elapsedMs } };
  const { motion } = timed.movement;
  if (motion.kind !== "moving") return timed;
  const sinceLastMoveMs = motion.sinceLastMoveMs + elapsedMs;
  if (sinceLastMoveMs < CONFIG.moveIntervalMs) {
    return { ...timed, movement: { ...timed.movement, motion: { kind: "moving", sinceLastMoveMs } } };
  }
  const moved = moveOneCell(timed);
  return { ...moved, movement: { ...moved.movement, motion: { kind: "moving", sinceLastMoveMs: sinceLastMoveMs - CONFIG.moveIntervalMs } } };
}

function moveOneCell(game: Playing): Playing {
  const [next, ...rest] = game.movement.queuedInputs;
  const direction = next ?? game.movement.direction;
  const { body: current } = game.stage;
  const body: StageState["body"] = [neighbor(current[0], direction), ...current.slice(0, game.run.length - 1)];
  return { ...game, stage: { ...game.stage, body }, movement: { ...game.movement, direction, queuedInputs: rest } };
}
