import { CONFIG } from "../config";
import { startRun, step } from "./game";
import type { Cell, Direction, Game, GameEvent, RunSetup } from "./types";

export const CENTER: Cell = { x: 7, y: 7 };
export const FAR_CORNER: Cell = { x: 0, y: 0 };

/** 壁なしの盤面で、指定した方向に進み出したところ */
export function begin(direction: Direction, setup: RunSetup = {}, seed = 1): Game {
  const game = startRun(seed, { walls: [], battery: FAR_CORNER, ...setup });
  return step(game, [direction], 0).game;
}

export function tick(game: Game, input: readonly Direction[] = []) {
  return step(game, input, CONFIG.moveIntervalMs);
}

export function ticks(game: Game, count: number): { game: Game; events: GameEvent[] } {
  const events: GameEvent[] = [];
  for (let i = 0; i < count; i++) {
    const result = tick(game);
    game = result.game;
    events.push(...result.events);
  }
  return { game, events };
}

export function stageOf(game: Game) {
  if (!("stage" in game)) throw new Error(`stageがない局面: ${game.phase}`);
  return game.stage;
}

export const headOf = (game: Game) => stageOf(game).body[0];

/** すぐ右のゴールに入って、クリアの局面になったところ */
export function cleared(setup: RunSetup = {}, seed = 1): Game {
  const game = begin("right", { goal: { x: 8, y: 7 }, batteriesEaten: CONFIG.batteriesToGoal, ...setup }, seed);
  return tick(game).game;
}

export function offersOf(game: Game) {
  if (game.phase !== "shop") throw new Error(`モジュールの画面ではない: ${game.phase}`);
  return game.offers;
}
