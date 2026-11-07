import { describe, expect, it } from "vite-plus/test";
import { CONFIG, type Tuning } from "../config";
import { begin, CENTER, stageOf, TEST_TUNING, tick, ticks } from "./testing";
import type { Cell, RunSetup } from "./types";

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const TOP_ROW_WALLS: Cell[] = Array.from({ length: CONFIG.boardSize }, (_, x) => ({ x, y: 0 }));
const seeds = Array.from({ length: 30 }, (_, i) => i + 1);

describe("step: バッテリーとゴール", () => {
  it("バッテリーを食べると長さ+1、PP+1、累計PP+1、食べた数+1、イベントが出る", () => {
    const { game, events } = tick(begin("right", { battery: { x: 8, y: 7 } }));
    expect(game.run).toMatchObject({ length: 4, pp: CONFIG.ppPerBattery, totalPp: CONFIG.ppPerBattery });
    expect(stageOf(game).batteriesEaten).toBe(1);
    expect(events).toContainEqual({ type: "batteryEaten", at: { x: 8, y: 7 } });
  });

  it("次のバッテリーは壁、体、中央のマスと重ならないマスに出る", () => {
    for (const seed of seeds) {
      const { game } = tick(begin("right", { walls: TOP_ROW_WALLS, battery: { x: 8, y: 7 } }, seed));
      const stage = stageOf(game);
      const occupied = [...TOP_ROW_WALLS, ...stage.body, CENTER];
      expect(occupied.some((c) => sameCell(c, stage.battery))).toBe(false);
    }
  });

  it("n個目を食べるとゴールが出て、イベントが出る", () => {
    for (const seed of seeds) {
      const setup = { walls: TOP_ROW_WALLS, battery: { x: 8, y: 7 }, batteriesEaten: CONFIG.batteriesToGoal - 1 };
      const { game, events } = tick(begin("right", setup, seed));
      const { goal, body, battery } = stageOf(game);
      if (goal === null) throw new Error("ゴールが出ていない");
      expect(events).toContainEqual({ type: "goalAppeared", at: goal });
      const occupied = [...TOP_ROW_WALLS, ...body, CENTER, battery];
      expect(occupied.some((c) => sameCell(c, goal))).toBe(false);
    }
  });

  it("ゴールに入るとクリアになり、イベントが出る", () => {
    const setup = { goal: { x: 8, y: 7 }, batteriesEaten: CONFIG.batteriesToGoal };
    const { game, events } = tick(begin("right", setup));
    expect(game.phase).toBe("cleared");
    expect(events).toContainEqual({ type: "cleared" });
  });
});

/** 5×5の盤面で、床は中央(2,2)から左へ(0,2)、上へ(0,1)の4マスだけ。そこを長さ4の体で埋めて(0,1)のバッテリーを食べる */
const FULL_BOARD_TUNING: Tuning = { ...TEST_TUNING, config: { ...TEST_TUNING.config, boardSize: 5 } };
const OPEN_CELLS: Cell[] = [
  { x: 2, y: 2 },
  { x: 1, y: 2 },
  { x: 0, y: 2 },
  { x: 0, y: 1 },
];
const CLOSED_WALLS: Cell[] = Array.from({ length: 25 }, (_, i) => ({ x: i % 5, y: Math.floor(i / 5) })).filter(
  (c) => !OPEN_CELLS.some((o) => sameCell(o, c)),
);
const fillBoardAndEat = (setup: RunSetup = {}, seed = 1) => {
  let game = begin(
    "left",
    { tuning: FULL_BOARD_TUNING, walls: CLOSED_WALLS, battery: { x: 0, y: 1 }, length: 4, ...setup },
    seed,
  );
  game = tick(game).game;
  game = tick(game).game;
  return tick(game, ["up"]);
};

describe("step: 空きマスがないとき", () => {
  it("次のバッテリーは、頭を除く体のマスに出る", () => {
    for (const seed of seeds) {
      const { game, events } = fillBoardAndEat({}, seed);
      expect(events).toContainEqual({ type: "batteryEaten", at: { x: 0, y: 1 } });
      const { body, battery } = stageOf(game);
      expect(body.slice(1)).toContainEqual(battery);
    }
  });

  it("ゴールも、頭を除く体のマスに、バッテリーと重ならずに出る", () => {
    for (const seed of seeds) {
      const { game } = fillBoardAndEat({ batteriesEaten: CONFIG.batteriesToGoal - 1 }, seed);
      const { body, battery, goal } = stageOf(game);
      if (goal === null) throw new Error("ゴールが出ていない");
      expect(body.slice(1)).toContainEqual(goal);
      expect(sameCell(goal, battery)).toBe(false);
    }
  });

  it("ハートも、頭を除く体のマスに、ほかのものと重ならずに出る", () => {
    for (const seed of seeds) {
      const { game } = fillBoardAndEat({ totalPp: CONFIG.heartEveryTotalPp - 1 }, seed);
      const { body, battery, hearts } = stageOf(game);
      expect(hearts.length).toBeGreaterThanOrEqual(1);
      for (const heart of hearts) {
        expect(body.slice(1)).toContainEqual(heart);
        expect(sameCell(heart, battery)).toBe(false);
      }
      expect(new Set(hearts.map((h) => JSON.stringify(h))).size).toBe(hearts.length);
    }
  });

  it("体をすり抜けて入ったマスのバッテリーを取る", () => {
    // 長さ7で右へ6マス進み、Uの字に折り返して、(12,7)の体の上のバッテリーに入る
    let game = ticks(begin("right", { length: 7 }), 6).game;
    game = tick(game, ["down"]).game;
    game = tick(game, ["left"]).game;
    if (!("stage" in game)) throw new Error(game.phase);
    const withBattery = { ...game, stage: { ...game.stage, battery: { x: 12, y: 7 } } };
    const { game: entered, events } = tick(withBattery, ["up"]);
    expect(events).toContainEqual({ type: "collided", obstacle: "body", damaged: true });
    expect(events).toContainEqual({ type: "batteryEaten", at: { x: 12, y: 7 } });
    expect(entered.run.pp).toBe(CONFIG.ppPerBattery);
  });
});
