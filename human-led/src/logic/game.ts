import { CONFIG } from "../config";
import { pick } from "./rng";
import { WALL_PATTERNS } from "./wallPatterns";
import type { Cell, Direction, Game, RngState, RunSetup, StepResult } from "./types";

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
  const body = [CENTER];
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

export function step(_game: Game, _input: readonly Direction[], _elapsedMs: number): StepResult {
  throw new Error("not implemented");
}
