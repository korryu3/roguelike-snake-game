import { describe, expect, it } from "vite-plus/test";
import { CONFIG } from "../config";
import { nextStage } from "./game";
import { openShop } from "./shop";
import { begin, CENTER, cleared, stageOf, tick } from "./testing";
import type { Cell, RunSetup } from "./types";

const AHEAD = { x: 8, y: 7 };
const TOP_ROW_WALLS: Cell[] = Array.from({ length: CONFIG.boardSize }, (_, x) => ({ x, y: 0 }));
const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const seeds = Array.from({ length: 200 }, (_, i) => i + 1);

const eatAhead = (setup: RunSetup = {}, seed = 1) => tick(begin("right", { battery: AHEAD, ...setup }, seed));

describe("step: ハートが出る", () => {
  it("累計獲得PPが基準を超えると、空きマスにハートが出る", () => {
    for (const seed of seeds.slice(0, 30)) {
      const goal = { x: 3, y: 3 };
      const { game } = eatAhead(
        { walls: TOP_ROW_WALLS, goal, batteriesEaten: CONFIG.batteriesToGoal, totalPp: CONFIG.heartEveryTotalPp - 1 },
        seed,
      );
      const { hearts, body, battery } = stageOf(game);
      expect(hearts.length).toBeGreaterThanOrEqual(1);
      const occupied = [...TOP_ROW_WALLS, ...body, battery, goal, CENTER];
      for (const heart of hearts) expect(occupied.some((c) => sameCell(c, heart))).toBe(false);
      expect(new Set(hearts.map((h) => JSON.stringify(h))).size).toBe(hearts.length);
    }
  });

  it("基準を超えなくても、バッテリーが出るときにまれにハートが出る", () => {
    const spawned = seeds.filter((seed) => stageOf(eatAhead({}, seed).game).hearts.length > 0);
    expect(spawned.length).toBeGreaterThan(0);
    expect(spawned.length).toBeLessThan(seeds.length * 0.1);
  });
});

describe("step: ハートと重ならない", () => {
  it("次のバッテリーはハートと重ならず、置き場所がなければハートは出ない", () => {
    const lastFree = { x: 0, y: 0 };
    const reserved = [lastFree, AHEAD, CENTER];
    const hearts: Cell[] = Array.from({ length: CONFIG.boardSize ** 2 }, (_, i) => ({
      x: i % CONFIG.boardSize,
      y: Math.floor(i / CONFIG.boardSize),
    })).filter((c) => !reserved.some((r) => sameCell(r, c)));
    const { game } = eatAhead({ hearts, totalPp: CONFIG.heartEveryTotalPp - 1 });
    expect(stageOf(game).battery).toEqual(lastFree);
    expect(stageOf(game).hearts).toHaveLength(hearts.length);
  });
});

describe("step: ハートを取る", () => {
  it("取るとHPが1回復し、体は伸びず、ハートが消え、イベントが出る", () => {
    const before = begin("right", { hearts: [AHEAD], hp: 2 });
    const { game, events } = tick(before);
    expect(game.run.hp).toBe(3);
    expect(game.run.length).toBe(before.run.length);
    expect(stageOf(game).hearts).toEqual([]);
    expect(events).toContainEqual({ type: "heartCollected", at: AHEAD });
  });

  it("HPが上限のときに取っても、HPは増えない", () => {
    const { game } = tick(begin("right", { hearts: [AHEAD] }));
    expect(game.run.hp).toBe(CONFIG.initialHp);
    expect(stageOf(game).hearts).toEqual([]);
  });

  it("HPの上限+1を持っていると、増えた上限まで回復する", () => {
    const { game } = tick(begin("right", { hearts: [AHEAD], modules: ["maxHpPlus1"] }));
    expect(game.run.hp).toBe(CONFIG.initialHp + 1);
  });

  it("取らなかったハートは盤面に残る", () => {
    const heart = { x: 2, y: 2 };
    const { game } = tick(begin("right", { hearts: [heart] }));
    expect(stageOf(game).hearts).toEqual([heart]);
  });
});

describe("nextStage: ハート", () => {
  it("残っていたハートは、次のステージでは消えている", () => {
    const shop = openShop(cleared({ hearts: [{ x: 2, y: 2 }] })).game;
    expect(stageOf(nextStage(shop).game).hearts).toEqual([]);
  });
});
