import { describe, expect, it } from "vite-plus/test";
import { CONFIG } from "../config";
import { begin, CENTER, stageOf, tick } from "./testing";
import type { Cell } from "./types";

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
