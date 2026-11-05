import { CONFIG } from "../config";
import { pick } from "./rng";
import { WALL_PATTERNS } from "./wallPatterns";
import type { Cell, Direction, Game, GameEvent, RngState, RunSetup, StageState, StepResult } from "./types";

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
      return advance(enqueue(game, input), elapsedMs);
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

function advance(game: Playing, elapsedMs: number): StepResult {
  const timed: Playing = { ...game, stage: { ...game.stage, remainingMs: game.stage.remainingMs - elapsedMs } };
  const { motion } = timed.movement;
  if (motion.kind !== "moving") return { game: timed, events: [] };
  const sinceLastMoveMs = motion.sinceLastMoveMs + elapsedMs;
  if (sinceLastMoveMs < CONFIG.moveIntervalMs) {
    return { game: { ...timed, movement: { ...timed.movement, motion: { kind: "moving", sinceLastMoveMs } } }, events: [] };
  }
  const waited: Playing = {
    ...timed,
    movement: { ...timed.movement, motion: { kind: "moving", sinceLastMoveMs: sinceLastMoveMs - CONFIG.moveIntervalMs } },
  };
  return moveOneCell(waited);
}

function moveOneCell(game: Playing): StepResult {
  const [next, ...rest] = game.movement.queuedInputs;
  const direction = next ?? game.movement.direction;
  const { body: current } = game.stage;
  const head = neighbor(current[0], direction);
  const body: StageState["body"] = [head, ...current.slice(0, game.run.length - 1)];
  const moved: Playing = { ...game, stage: { ...game.stage, body }, movement: { ...game.movement, direction, queuedInputs: rest } };
  if (game.stage.goal && sameCell(head, game.stage.goal)) {
    return { game: { phase: "cleared", run: moved.run, stage: moved.stage }, events: [{ type: "cleared" }] };
  }
  if (sameCell(head, game.stage.battery)) return eatBattery(moved);
  return { game: moved, events: [] };
}

function eatBattery(game: Playing): StepResult {
  const { run, stage } = game;
  const events: GameEvent[] = [{ type: "batteryEaten", at: stage.battery }];
  const occupied = [...stage.walls, ...stage.body, ...(stage.goal ? [stage.goal] : [])];
  const [battery, rngAfterBattery] = spawnOnFreeCell(run.rng, occupied);
  const batteriesEaten = stage.batteriesEaten + 1;
  const reachedGoal = stage.goal === null && batteriesEaten >= CONFIG.batteriesToGoal;
  const [goal, rng] = reachedGoal ? spawnOnFreeCell(rngAfterBattery, [...occupied, battery]) : [stage.goal, rngAfterBattery];
  if (reachedGoal && goal) events.push({ type: "goalAppeared", at: goal });
  return {
    game: {
      ...game,
      run: {
        ...run,
        length: run.length + 1,
        pp: run.pp + CONFIG.ppPerBattery,
        totalPp: run.totalPp + CONFIG.ppPerBattery,
        rng,
      },
      stage: { ...stage, battery, goal, batteriesEaten },
    },
    events,
  };
}
