import { DEFAULT_TUNING } from "../config";
import { centerOf, DIRECTIONS, insideBoard, neighbor, OPPOSITE, placeableCells, sameCell, spawnCell } from "./board";
import { consumeAtStageStart, consumeOne, type Effects, effectsOf, REVIVE_HP } from "./modules";
import { nextFloat, pick } from "./rng";
import { placeWallPattern } from "./wallPatterns";
import type {
  BatteryKind,
  Cell,
  ClearSummary,
  Direction,
  Game,
  GameEvent,
  ModuleId,
  Obstacle,
  RngState,
  RunSetup,
  RunState,
  StageState,
  StepResult,
} from "./types";

export function startRun(seed: number, setup: RunSetup = {}): Game {
  const tuning = setup.tuning ?? DEFAULT_TUNING;
  const run: RunState = {
    length: setup.length ?? tuning.config.initialLength,
    hp: setup.hp ?? tuning.config.initialHp,
    pp: setup.pp ?? 0,
    totalPp: setup.totalPp ?? 0,
    score: 0,
    modules: setup.modules ?? [],
    purchased: [],
    stageNumber: 1,
    rng: seed,
    tuning,
  };
  return enterStage(run, setup);
}

export function nextStage(game: Game): StepResult {
  if (game.phase !== "shop") return { game, events: [] };
  return { game: enterStage({ ...game.run, stageNumber: game.run.stageNumber + 1 }), events: [] };
}

function enterStage(run: RunState, setup: RunSetup = {}): Game {
  const { config } = run.tuning;
  const [pattern, rngAfterWalls] = pick(run.rng, run.tuning.wallPatterns);
  const walls = setup.walls ?? placeWallPattern(pattern, config.boardSize);
  const body: StageState["body"] = [centerOf(config.boardSize)];
  const effects = effectsOf(run.modules, config);
  const [spawned, spawnedKind, rng] = spawnBattery(rngAfterWalls, walls, body, effects, config.boardSize);
  const { timeLimitMs } = effects;
  return {
    phase: "awaitingStart",
    run: { ...run, modules: consumeAtStageStart(run.modules), rng },
    stage: {
      body,
      walls,
      battery: setup.battery ?? spawned,
      batteryKind: setup.batteryKind ?? spawnedKind,
      goal: setup.goal ?? null,
      hearts: setup.hearts ?? [],
      timeLimitMs,
      remainingMs: timeLimitMs,
      batteriesEaten: setup.batteriesEaten ?? 0,
      ppEarned: 0,
    },
  };
}

export function revive(game: Game, module: ModuleId): StepResult {
  if (game.phase !== "reviveChoice") return { game, events: [] };
  const modules = consumeOne(game.run.modules, module);
  const reviveHp = REVIVE_HP[module];
  if (reviveHp === undefined || modules === null) return { game, events: [] };
  return {
    // ステージ開始時と同じく、中央のマスに頭だけを置いて方向キーを待つ
    game: {
      phase: "awaitingStart",
      run: { ...game.run, hp: reviveHp(effectsOf(game.run.modules, game.run.tuning.config).maxHp), modules },
      stage: { ...game.stage, body: [centerOf(game.run.tuning.config.boardSize)] },
    },
    events: [{ type: "revived" }],
  };
}

/** ステージ中だけ止められる */
export function pause(game: Game): StepResult {
  if (game.phase !== "playing") return { game, events: [] };
  return { game: { ...game, phase: "paused" }, events: [] };
}

/** 生き返るモーダルで諦めたら死因はHP 0、ステージ中に設定メニューから諦めたら死因は「諦めた」 */
export function giveUp(game: Game): StepResult {
  if (game.phase === "reviveChoice") return { game: { phase: "gameOver", run: game.run, cause: "hp" }, events: [] };
  if (game.phase !== "paused" && game.phase !== "awaitingStart") return { game, events: [] };
  return { game: { phase: "gameOver", run: game.run, cause: "gaveUp" }, events: [] };
}

type Playing = Extract<Game, { phase: "playing" }>;

export function step(game: Game, input: readonly Direction[], elapsedMs: number): StepResult {
  switch (game.phase) {
    case "awaitingStart":
      return { game: startPlaying(game, input), events: [] };
    case "playing":
      return checkTimeUp(advance(enqueue(game, input), elapsedMs));
    case "paused":
      return { game: resume(game, input), events: [] };
    default:
      return { game, events: [] };
  }
}

/** 真後ろ以外の方向キーで再開する。ぶつかって止まっているなら、動き出すときにその方向を使う */
function resume(game: Extract<Game, { phase: "paused" }>, input: readonly Direction[]): Game {
  const direction = input.find((d) => d !== OPPOSITE[game.movement.direction]);
  if (direction === undefined) return game;
  const { movement } = game;
  const resumed =
    movement.motion.kind === "stunned"
      ? { ...movement, queuedInputs: [direction] }
      : { ...movement, direction, queuedInputs: [] };
  return { phase: "playing", run: game.run, stage: game.stage, movement: resumed };
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
  // 止まっているあいだは、最後に押した方向だけを覚える。真後ろ（首の方向）は捨てる
  if (game.movement.motion.kind === "stunned") {
    const last = input.findLast((d) => d !== OPPOSITE[game.movement.direction]);
    if (last === undefined) return game;
    return { ...game, movement: { ...game.movement, queuedInputs: [last] } };
  }
  const queuedInputs = input.reduce<readonly Direction[]>((queue, direction) => {
    const last = queue.at(-1) ?? game.movement.direction;
    if (queue.length >= game.run.tuning.config.inputQueueLimit || direction === OPPOSITE[last]) return queue;
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
  const { moveIntervalMs } = effectsOf(game.run.modules, game.run.tuning.config);
  const due = sinceLastMoveMs >= moveIntervalMs;
  const ticked: Playing = {
    ...timed,
    movement: {
      ...timed.movement,
      invincibleMs,
      motion: { kind: "moving", sinceLastMoveMs: due ? sinceLastMoveMs - moveIntervalMs : sinceLastMoveMs },
    },
  };
  return due ? moveOneCell(ticked) : { game: ticked, events: [] };
}

function randomEscape(game: Playing): [Direction, RngState] {
  const back = OPPOSITE[game.movement.direction];
  const toward = (d: Direction) => obstacleAt(game, neighbor(game.stage.body[0], d));
  // 空いている方向 → 体（真後ろ以外。すり抜けられる） → 真後ろの体 → どこでも、の順に選ぶ
  const tiers = [
    DIRECTIONS.filter((d) => toward(d) === null),
    DIRECTIONS.filter((d) => toward(d) === "body" && d !== back),
    DIRECTIONS.filter((d) => toward(d) === "body" && d === back),
  ];
  return pick(game.run.rng, tiers.find((tier) => tier.length > 0) ?? DIRECTIONS);
}

function recover(game: Playing, remainingMs: number): Playing {
  if (remainingMs > 0) return { ...game, movement: { ...game.movement, motion: { kind: "stunned", remainingMs } } };
  const queued = game.movement.queuedInputs.at(-1);
  const [direction, rng] = queued ? [queued, game.run.rng] : randomEscape(game);
  return {
    ...game,
    run: { ...game.run, rng },
    movement: {
      direction,
      queuedInputs: [],
      motion: { kind: "moving", sinceLastMoveMs: 0 },
      invincibleMs: game.run.tuning.config.invincibleMs,
    },
  };
}

function moveOneCell(game: Playing): StepResult {
  const [next, ...rest] = game.movement.queuedInputs;
  const turned: Playing = {
    ...game,
    movement: { ...game.movement, direction: next ?? game.movement.direction, queuedInputs: rest },
  };
  const head = neighbor(game.stage.body[0], turned.movement.direction);
  const obstacle = obstacleAt(game, head);
  if (obstacle) return collide(turned, obstacle);
  return arrive(enter(turned));
}

/** 頭が入ったマスのものを取る。体をすり抜けて入ったときも同じ。eventsは、入る前に起きたこと */
function arrive(game: Playing, events: readonly GameEvent[] = []): StepResult {
  const collected = collect(game);
  return { game: collected.game, events: [...events, ...collected.events] };
}

function collect(game: Playing): StepResult {
  const head = game.stage.body[0];
  if (game.stage.goal && sameCell(head, game.stage.goal)) return clearStage(game);
  if (sameCell(head, game.stage.battery)) return eatBattery(game);
  if (game.stage.hearts.some((h) => sameCell(h, head))) return collectHeart(game, head);
  return { game, events: [] };
}

function collectHeart(game: Playing, at: Cell): StepResult {
  const hearts = game.stage.hearts.filter((h) => !sameCell(h, at));
  const hp = Math.min(game.run.hp + 1, effectsOf(game.run.modules, game.run.tuning.config).maxHp);
  return {
    game: { ...game, run: { ...game.run, hp }, stage: { ...game.stage, hearts } },
    events: [{ type: "heartCollected", at }],
  };
}

function clearStage({ run, stage }: Playing): StepResult {
  const { config } = run.tuning;
  const summary: ClearSummary = {
    stageNumber: run.stageNumber,
    ppEarned: stage.ppEarned,
    batteryScore: stage.batteriesEaten * config.scorePerBattery,
    // 表示（formatRemainingTime）と同じく切り上げる。「0:05」でゴールしたら5秒分
    timeBonus: Math.ceil(stage.remainingMs / 1000) * config.timeBonusPerSecond,
    elapsedMs: stage.timeLimitMs - stage.remainingMs,
  };
  const scored = { ...run, score: run.score + summary.batteryScore + summary.timeBonus };
  return { game: { phase: "cleared", run: scored, stage, summary }, events: [{ type: "cleared" }] };
}

function eatBattery(game: Playing): StepResult {
  const { run, stage } = game;
  const { config } = run.tuning;
  const effects = effectsOf(run.modules, config);
  const events: GameEvent[] = [{ type: "batteryEaten", at: stage.battery }];
  const blocked = [...stage.walls, ...stage.hearts, ...(stage.goal ? [stage.goal] : [])];
  const [battery, batteryKind, rngAfterBattery] = spawnBattery(run.rng, blocked, stage.body, effects, config.boardSize);
  const batteriesEaten = stage.batteriesEaten + 1;
  const reachedGoal = stage.goal === null && batteriesEaten >= config.batteriesToGoal;
  const [goal, rngAfterGoal] = reachedGoal
    ? spawnCell(rngAfterBattery, [...blocked, battery], stage.body, config.boardSize)
    : [stage.goal, rngAfterBattery];
  if (reachedGoal && goal) events.push({ type: "goalAppeared", at: goal });
  const pp = config.ppPerBattery * effects.batteryMultiplier * (stage.batteryKind === "doublePp" ? 2 : 1);
  const totalPp = run.totalPp + pp;
  const [heartRoll, rngAfterRoll] = nextFloat(rngAfterGoal);
  const heartCount =
    Math.floor(totalPp / config.heartEveryTotalPp) -
    Math.floor(run.totalPp / config.heartEveryTotalPp) +
    (heartRoll < config.heartWithBatteryChance ? 1 : 0);
  const [newHearts, rng] = spawnHearts(
    rngAfterRoll,
    [...blocked, battery, ...(goal ? [goal] : [])],
    stage.body,
    heartCount,
    config.boardSize,
  );
  return {
    game: {
      ...game,
      run: { ...run, length: run.length + effects.batteryMultiplier, pp: run.pp + pp, totalPp, rng },
      stage: {
        ...stage,
        battery,
        batteryKind,
        goal,
        hearts: [...stage.hearts, ...newHearts],
        batteriesEaten,
        ppEarned: stage.ppEarned + pp,
      },
    },
    events,
  };
}

function spawnBattery(
  rng: RngState,
  blocked: readonly Cell[],
  body: readonly Cell[],
  effects: Effects,
  boardSize: number,
): [Cell, BatteryKind, RngState] {
  const [cell, rngAfterCell] = spawnCell(rng, blocked, body, boardSize);
  const [roll, next] = nextFloat(rngAfterCell);
  return [cell, roll < effects.doublePpBatteryChance ? "doublePp" : "normal", next];
}

/** 置けるマスがなくなったら、そこで出すのをやめる */
function spawnHearts(
  rng: RngState,
  blocked: readonly Cell[],
  body: readonly Cell[],
  count: number,
  boardSize: number,
): [Cell[], RngState] {
  if (count <= 0 || placeableCells(blocked, body, boardSize).length === 0) return [[], rng];
  const [heart, next] = spawnCell(rng, blocked, body, boardSize);
  const [rest, last] = spawnHearts(next, [...blocked, heart], body, count - 1, boardSize);
  return [[heart, ...rest], last];
}

function obstacleAt({ stage, run }: Playing, cell: Cell): Obstacle | null {
  if (!insideBoard(cell, run.tuning.config.boardSize) || stage.walls.some((w) => sameCell(w, cell))) return "wall";
  const tailLeaves = stage.body.length >= run.length;
  const blocking = tailLeaves ? stage.body.slice(0, -1) : stage.body;
  if (blocking.some((b) => sameCell(b, cell))) return "body";
  return null;
}

function collide(game: Playing, obstacle: Obstacle): StepResult {
  const cutModules = obstacle === "body" ? consumeOne(game.run.modules, "bodyCut") : null;
  if (cutModules) return cutBody({ ...game, run: { ...game.run, modules: cutModules } });
  // 体はすり抜けられる。無敵時間中ならダメージもない
  if (game.movement.invincibleMs > 0 && obstacle === "body") return arrive(enter(game));
  if (game.movement.invincibleMs > 0) {
    const [direction, rng] = randomEscape(game);
    return {
      game: { ...game, run: { ...game.run, rng }, movement: { ...game.movement, direction } },
      events: [{ type: "collided", obstacle, damaged: false }],
    };
  }
  const stunned = { kind: "stunned", remainingMs: game.run.tuning.config.stunMs } as const;
  const modules = obstacle === "wall" ? consumeOne(game.run.modules, "wallDamageImmunity") : null;
  if (modules) {
    return {
      game: { ...game, run: { ...game.run, modules }, movement: { ...game.movement, motion: stunned } },
      events: [{ type: "collided", obstacle, damaged: false }],
    };
  }
  const run = { ...game.run, hp: game.run.hp - 1 };
  const collided: GameEvent = { type: "collided", obstacle, damaged: true };
  if (run.hp <= 0) {
    const events: GameEvent[] = [collided, { type: "hpDepleted" }];
    if (run.modules.some((m) => REVIVE_HP[m])) {
      return { game: { phase: "reviveChoice", run, stage: game.stage }, events };
    }
    return { game: { phase: "gameOver", run, cause: "hp" }, events };
  }
  if (obstacle === "body") {
    const entered = enter(game);
    const movement = { ...entered.movement, invincibleMs: run.tuning.config.invincibleMs };
    return arrive({ ...entered, run, movement }, [collided]);
  }
  return {
    game: { ...game, run, movement: { ...game.movement, motion: stunned } },
    events: [collided],
  };
}

/** 頭が入ったマスから尻尾までを切り落とす。ダメージは受けず、止まらずに進む。残った体の長さがランの長さになる */
function cutBody(game: Playing): StepResult {
  const { body } = game.stage;
  const head = neighbor(body[0], game.movement.direction);
  const hitIndex = body.findIndex((b) => sameCell(b, head));
  const cut: StageState["body"] = [head, ...body.slice(0, hitIndex)];
  return arrive({ ...game, run: { ...game.run, length: cut.length }, stage: { ...game.stage, body: cut } }, [
    { type: "bodyCut" },
  ]);
}

/** 頭を向きの先のマスへ進める */
function enter(game: Playing): Playing {
  const { body: current } = game.stage;
  const body: StageState["body"] = [
    neighbor(current[0], game.movement.direction),
    ...current.slice(0, game.run.length - 1),
  ];
  return { ...game, stage: { ...game.stage, body } };
}
