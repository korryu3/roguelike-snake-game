import { describe, expect, test } from "vitest";
import { DEFAULT_TUNING, type Config, type ModuleSpec, type Tuning } from "../config";
import { nextStage, startRun, step } from "./game";
import { buyModule, openShop } from "./shop";
import { sameCell } from "./board";
import { stageOf } from "./testing";
import type { Game, ModuleId } from "./types";

const tuned = (config: Partial<Config>, modules: Partial<Record<ModuleId, ModuleSpec>> = {}): Tuning => ({
  config: { ...DEFAULT_TUNING.config, ...config },
  modules: { ...DEFAULT_TUNING.modules, ...modules },
});

const seeds = Array.from({ length: 30 }, (_, i) => i + 1);

/** 壁なしの中央から、右へ進み出したところ */
const beginRight = (tuning: Tuning, setup = {}, seed = 1) =>
  step(startRun(seed, { walls: [], battery: { x: 0, y: 0 }, tuning, ...setup }), ["right"], 0).game;

const shopOf = (tuning: Tuning, pp: number, seed = 1): Game => {
  const game = beginRight(tuning, { goal: { x: 8, y: 7 }, batteriesEaten: tuning.config.batteriesToGoal, pp }, seed);
  return openShop(step(game, [], tuning.config.moveIntervalMs).game).game;
};

describe("数値を受け取るロジック", () => {
  test("移動間隔を変えると、その間隔で1マス進み、それより短いと進まない", () => {
    const tuning = tuned({ moveIntervalMs: 40 });
    const start = beginRight(tuning);
    expect(stageOf(step(start, [], 39).game).body[0]).toEqual({ x: 7, y: 7 });
    expect(stageOf(step(start, [], 40).game).body[0]).toEqual({ x: 8, y: 7 });
  });

  test("制限時間を変えると、残り時間がその値で始まり、その時間で時間切れになる", () => {
    const tuning = tuned({ timeLimitMs: 3_000 });
    const start = beginRight(tuning);
    expect(stageOf(start).remainingMs).toBe(3_000);
    expect(step(start, [], 3_000).game.phase).toBe("gameOver");
  });

  test("盤面の大きさを変えると、頭はその盤面の中央に置かれ、壁とバッテリーは盤面の中にある", () => {
    const size = 9;
    const tuning = tuned({ boardSize: size });
    for (const seed of seeds) {
      const stage = stageOf(startRun(seed, { tuning }));
      expect(stage.body).toEqual([{ x: 4, y: 4 }]);
      for (const cell of [...stage.walls, stage.battery]) {
        expect(cell.x >= 0 && cell.y >= 0 && cell.x < size && cell.y < size).toBe(true);
        expect(sameCell(cell, { x: 4, y: 4 })).toBe(false);
      }
    }
  });

  test("盤面の大きさを変えると、その盤面の端の外にぶつかる", () => {
    const tuning = tuned({ boardSize: 9 });
    let game = beginRight(tuning);
    for (let i = 0; i < 4; i++) game = step(game, [], tuning.config.moveIntervalMs).game;
    expect(stageOf(game).body[0]).toEqual({ x: 8, y: 4 });
    const { events } = step(game, [], tuning.config.moveIntervalMs);
    expect(events).toContainEqual({ type: "collided", obstacle: "wall", damaged: true });
  });

  test("モジュールの値段を変えると、その値段でPPが減る", () => {
    const prices = Object.fromEntries(
      Object.entries(DEFAULT_TUNING.modules).map(([id, spec]) => [id, { ...spec, price: 1 }]),
    );
    const tuning = tuned({}, prices);
    const { game } = buyModule(shopOf(tuning, 10), 0);
    expect(game.run.pp).toBe(9);
  });

  test("重ねられる上限を0にしたモジュールは候補に出ない", () => {
    const tuning = tuned({}, { revive: { price: 12, maxStack: 0 }, maxHpPlus1: { price: 7, maxStack: 0 } });
    for (const seed of seeds) {
      const game = shopOf(tuning, 0, seed);
      if (game.phase !== "shop") throw new Error(game.phase);
      expect(game.offers.map((o) => o.module)).not.toContain("revive");
      expect(game.offers.map((o) => o.module)).not.toContain("maxHpPlus1");
    }
  });

  test("次のステージに進んでも、ランを始めたときの数値のまま", () => {
    const tuning = tuned({ timeLimitMs: 7_000 });
    const next = nextStage(shopOf(tuning, 0)).game;
    expect(next.run.tuning).toEqual(tuning);
    expect(stageOf(next).remainingMs).toBe(7_000);
  });

  test("同じシードと同じ数値なら、同じ展開になる", () => {
    const tuning = tuned({ boardSize: 11, moveIntervalMs: 90 });
    const play = () => {
      let game = step(startRun(42, { tuning }), ["up"], 0).game;
      for (let i = 0; i < 20; i++) game = step(game, i % 5 === 0 ? ["left"] : [], 90).game;
      return game;
    };
    expect(play()).toEqual(play());
  });
});
