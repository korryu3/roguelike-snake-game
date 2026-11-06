import { describe, expect, it } from "vitest";
import { CONFIG, DEFAULT_TUNING, type Tuning } from "../config";
import { centerOf } from "./board";
import { startRun } from "./game";
import { checkWallPattern, placeWallPattern } from "./wallPatterns";
import type { Cell } from "./types";

const CENTER: Cell = centerOf(CONFIG.boardSize);
const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const seeds = Array.from({ length: 50 }, (_, i) => i + 1);

describe("startRun", () => {
  it("ランは長さ3、HP3、PP0、ステージ1で始まる", () => {
    const { run } = startRun(1);
    expect(run).toMatchObject({ length: 3, hp: 3, pp: 0, totalPp: 0, score: 0, modules: [], stageNumber: 1 });
  });

  it("ステージは開始待ちで、頭だけが中央のマスにある", () => {
    const game = startRun(1);
    expect(game.phase).toBe("awaitingStart");
    if (game.phase !== "awaitingStart") return;
    expect(game.stage.body).toEqual([CENTER]);
  });

  it("既定の制限時間は60秒", () => {
    expect(CONFIG.timeLimitMs).toBe(60_000);
  });

  it("残り時間は制限時間いっぱい、食べた数は0、ゴールはない", () => {
    const game = startRun(1);
    if (game.phase !== "awaitingStart") throw new Error(game.phase);
    expect(game.stage).toMatchObject({ remainingMs: CONFIG.timeLimitMs, batteriesEaten: 0, goal: null, hearts: [] });
  });

  it("壁は中央とそのまわりを空けている", () => {
    for (const seed of seeds) {
      const game = startRun(seed);
      if (game.phase !== "awaitingStart") throw new Error(game.phase);
      const nearCenter = game.stage.walls.filter((w) => Math.abs(w.x - CENTER.x) <= 1 && Math.abs(w.y - CENTER.y) <= 1);
      expect(nearCenter).toEqual([]);
    }
  });

  it("シードによって壁のパターンが変わる", () => {
    const wallSets = new Set(
      seeds.map((seed) => {
        const game = startRun(seed);
        if (game.phase !== "awaitingStart") throw new Error(game.phase);
        return JSON.stringify(game.stage.walls);
      }),
    );
    expect(wallSets.size).toBeGreaterThan(1);
  });

  it("同じシードなら同じ状態になる", () => {
    expect(startRun(42)).toEqual(startRun(42));
  });

  it("最初のバッテリーは壁とも中央とも重ならない", () => {
    for (const seed of seeds) {
      const game = startRun(seed);
      if (game.phase !== "awaitingStart") throw new Error(game.phase);
      const { battery, walls } = game.stage;
      expect(sameCell(battery, CENTER)).toBe(false);
      expect(walls.some((w) => sameCell(w, battery))).toBe(false);
      expect(battery.x).toBeGreaterThanOrEqual(0);
      expect(battery.x).toBeLessThan(CONFIG.boardSize);
      expect(battery.y).toBeGreaterThanOrEqual(0);
      expect(battery.y).toBeLessThan(CONFIG.boardSize);
    }
  });

  it("最初のバッテリーはシードによって違うマスに出る", () => {
    const positions = new Set(
      seeds.map((seed) => {
        const game = startRun(seed);
        if (game.phase !== "awaitingStart") throw new Error(game.phase);
        return JSON.stringify(game.stage.battery);
      }),
    );
    expect(positions.size).toBeGreaterThan(1);
  });

  it("ステージの壁は、数値に入っているパターンのどれかから作る", () => {
    const patterns = [["#.....#", ".......", ".......", ".......", ".......", ".......", "#.....#"], ["...#..."]];
    const tuning: Tuning = { ...DEFAULT_TUNING, wallPatterns: patterns };
    const placed = patterns.map((p) => placeWallPattern(p, CONFIG.boardSize));
    const seen = seeds.map((seed) => {
      const game = startRun(seed, { tuning });
      if (game.phase !== "awaitingStart") throw new Error(game.phase);
      return game.stage.walls;
    });
    for (const walls of seen) expect(placed).toContainEqual(walls);
    for (const walls of placed) expect(seen).toContainEqual(walls);
  });

  it("既定の盤面は19×19で、頭は(9,9)に置かれる", () => {
    expect(CONFIG.boardSize).toBe(19);
    const game = startRun(1);
    if (game.phase !== "awaitingStart") throw new Error(game.phase);
    expect(game.stage.body).toEqual([{ x: 9, y: 9 }]);
  });

  it("既定のパターンはどれも検査を通る", () => {
    for (const pattern of DEFAULT_TUNING.wallPatterns) expect(checkWallPattern(pattern)).toBeNull();
  });
});
