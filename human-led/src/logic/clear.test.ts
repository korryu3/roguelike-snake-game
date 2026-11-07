import { describe, expect, it } from "vite-plus/test";
import { CONFIG } from "../config";
import { step } from "./game";
import { begin, ticks } from "./testing";
import type { Game } from "./types";

const AHEAD = { x: 8, y: 7 };
const TWO_AHEAD = { x: 9, y: 7 };

const summaryOf = (game: Game) => {
  if (game.phase !== "cleared") throw new Error(`クリアの局面ではない: ${game.phase}`);
  return game.summary;
};

describe("step: クリア", () => {
  it("ゴールに入ると、スコアに食べたバッテリーの数×係数が足される", () => {
    const enterGoal = (batteriesEaten: number) =>
      step(begin("right", { goal: AHEAD, batteriesEaten }), [], CONFIG.moveIntervalMs).game.run.score;
    const n = CONFIG.batteriesToGoal;
    expect(enterGoal(n + 3) - enterGoal(n)).toBe(3 * CONFIG.scorePerBattery);
  });

  it("時間ボーナスは、ゴールに入った時点の残り秒数（端数切り捨て）×係数", () => {
    const elapsed = CONFIG.timeLimitMs - 30_500;
    const { game } = step(begin("right", { goal: AHEAD, batteriesEaten: CONFIG.batteriesToGoal }), [], elapsed);
    expect(summaryOf(game).timeBonus).toBe(30 * CONFIG.timeBonusPerSecond);
    expect(game.run.score).toBe(CONFIG.batteriesToGoal * CONFIG.scorePerBattery + 30 * CONFIG.timeBonusPerSecond);
  });

  it("クリアの内訳に、ステージ番号、獲得PP、バッテリーの分、時間ボーナスの分、かかった時間が入る", () => {
    const setup = { battery: AHEAD, goal: TWO_AHEAD, batteriesEaten: CONFIG.batteriesToGoal };
    const { game } = ticks(begin("right", setup), 2);
    const elapsedMs = 2 * CONFIG.moveIntervalMs;
    expect(summaryOf(game)).toEqual({
      stageNumber: 1,
      ppEarned: CONFIG.ppPerBattery,
      batteryScore: (CONFIG.batteriesToGoal + 1) * CONFIG.scorePerBattery,
      timeBonus: Math.floor((CONFIG.timeLimitMs - elapsedMs) / 1000) * CONFIG.timeBonusPerSecond,
      elapsedMs,
    });
  });

  it("時間ボーナスはPPに足されない", () => {
    const setup = { battery: AHEAD, goal: TWO_AHEAD, batteriesEaten: CONFIG.batteriesToGoal };
    const { game } = ticks(begin("right", setup), 2);
    expect(game.run).toMatchObject({ pp: CONFIG.ppPerBattery, totalPp: CONFIG.ppPerBattery });
  });
});
