import { CONFIG } from "../config";
import { CENTER, DIRECTIONS, insideBoard, neighbor, OPPOSITE, sameCell, spawnOnFreeCell } from "./board";
import { pick } from "./rng";
import { WALL_PATTERNS } from "./wallPatterns";
import type { Cell, ClearSummary, Direction, Game, GameEvent, ModuleId, Obstacle, RngState, RunSetup, StageState, StepResult } from "./types";

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
      timeLimitMs: CONFIG.timeLimitMs,
      remainingMs: CONFIG.timeLimitMs,
      batteriesEaten: setup.batteriesEaten ?? 0,
      ppEarned: 0,
    },
  };
}

type Playing = Extract<Game, { phase: "playing" }>;

export function step(game: Game, input: readonly Direction[], elapsedMs: number): StepResult {
  switch (game.phase) {
    case "awaitingStart":
      return { game: startPlaying(game, input), events: [] };
    case "playing":
      return checkTimeUp(advance(enqueue(game, input), elapsedMs));
    default:
      return { game, events: [] };
  }
}

function checkTimeUp({ game, events }: StepResult): StepResult {
  if (game.phase !== "playing" || game.stage.remainingMs > 0) return { game, events };
  return { game: { phase: "gameOver", run: game.run, cause: "timeUp" }, events: [...events, { type: "timeUp" }] };
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
  if (motion.kind === "stunned") return { game: recover(timed, motion.remainingMs - elapsedMs), events: [] };
  const invincibleMs = Math.max(0, timed.movement.invincibleMs - elapsedMs);
  const sinceLastMoveMs = motion.sinceLastMoveMs + elapsedMs;
  const due = sinceLastMoveMs >= CONFIG.moveIntervalMs;
  const ticked: Playing = {
    ...timed,
    movement: {
      ...timed.movement,
      invincibleMs,
      motion: { kind: "moving", sinceLastMoveMs: due ? sinceLastMoveMs - CONFIG.moveIntervalMs : sinceLastMoveMs },
    },
  };
  return due ? moveOneCell(ticked) : { game: ticked, events: [] };
}

function randomEscape(game: Playing): [Direction, RngState] {
  const safe = DIRECTIONS.filter((d) => obstacleAt(game, neighbor(game.stage.body[0], d)) === null);
  return pick(game.run.rng, safe.length > 0 ? safe : DIRECTIONS);
}

function recover(game: Playing, remainingMs: number): Playing {
  if (remainingMs > 0) return { ...game, movement: { ...game.movement, motion: { kind: "stunned", remainingMs } } };
  const queued = game.movement.queuedInputs.at(-1);
  const [direction, rng] = queued ? [queued, game.run.rng] : randomEscape(game);
  return {
    ...game,
    run: { ...game.run, rng },
    movement: { direction, queuedInputs: [], motion: { kind: "moving", sinceLastMoveMs: 0 }, invincibleMs: CONFIG.invincibleMs },
  };
}

function moveOneCell(game: Playing): StepResult {
  const [next, ...rest] = game.movement.queuedInputs;
  const turned: Playing = { ...game, movement: { ...game.movement, direction: next ?? game.movement.direction, queuedInputs: rest } };
  const { body: current } = game.stage;
  const head = neighbor(current[0], turned.movement.direction);
  const obstacle = obstacleAt(game, head);
  if (obstacle) return collide(turned, obstacle);
  const body: StageState["body"] = [head, ...current.slice(0, game.run.length - 1)];
  const moved: Playing = { ...turned, stage: { ...game.stage, body } };
  if (game.stage.goal && sameCell(head, game.stage.goal)) return clearStage(moved);
  if (sameCell(head, game.stage.battery)) return eatBattery(moved);
  return { game: moved, events: [] };
}

function clearStage({ run, stage }: Playing): StepResult {
  const summary: ClearSummary = {
    stageNumber: run.stageNumber,
    ppEarned: stage.ppEarned,
    batteryScore: stage.batteriesEaten * CONFIG.scorePerBattery,
    timeBonus: Math.floor(stage.remainingMs / 1000) * CONFIG.timeBonusPerSecond,
    elapsedMs: stage.timeLimitMs - stage.remainingMs,
  };
  const scored = { ...run, score: run.score + summary.batteryScore + summary.timeBonus };
  return { game: { phase: "cleared", run: scored, stage, summary }, events: [{ type: "cleared" }] };
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
      stage: { ...stage, battery, goal, batteriesEaten, ppEarned: stage.ppEarned + CONFIG.ppPerBattery },
    },
    events,
  };
}

function obstacleAt({ stage, run }: Playing, cell: Cell): Obstacle | null {
  if (!insideBoard(cell) || stage.walls.some((w) => sameCell(w, cell))) return "wall";
  const tailLeaves = stage.body.length >= run.length;
  const blocking = tailLeaves ? stage.body.slice(0, -1) : stage.body;
  if (blocking.some((b) => sameCell(b, cell))) return "body";
  return null;
}

const REVIVE_MODULES: readonly ModuleId[] = ["revive", "reviveAtOneHp"];

function collide(game: Playing, obstacle: Obstacle): StepResult {
  if (game.movement.invincibleMs > 0) {
    const [direction, rng] = randomEscape(game);
    return {
      game: { ...game, run: { ...game.run, rng }, movement: { ...game.movement, direction } },
      events: [{ type: "collided", obstacle, damaged: false }],
    };
  }
  const run = { ...game.run, hp: game.run.hp - 1 };
  const collided: GameEvent = { type: "collided", obstacle, damaged: true };
  if (run.hp <= 0) {
    const events: GameEvent[] = [collided, { type: "hpDepleted" }];
    if (run.modules.some((m) => REVIVE_MODULES.includes(m))) {
      return { game: { phase: "reviveChoice", run, stage: game.stage, movement: game.movement }, events };
    }
    return { game: { phase: "gameOver", run, cause: "hp" }, events };
  }
  return {
    game: { ...game, run, movement: { ...game.movement, motion: { kind: "stunned", remainingMs: CONFIG.stunMs } } },
    events: [collided],
  };
}
