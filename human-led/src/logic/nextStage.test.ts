import { describe, expect, it } from "vite-plus/test";
import { CONFIG, DEFAULT_TUNING } from "../config";
import { nextStage } from "./game";
import { openShop } from "./shop";
import { begin, CENTER, cleared, stageOf, TEST_TUNING, ticks } from "./testing";
import { placeWallPattern } from "./wallPatterns";
import type { Game, RunSetup } from "./types";

/** バッテリーを1個食べてからゴールに入り、モジュールの画面を経て次のステージへ進む */
const toNextStage = (setup: RunSetup = {}) => {
  const run = ticks(
    begin("right", { battery: { x: 8, y: 7 }, goal: { x: 9, y: 7 }, batteriesEaten: CONFIG.batteriesToGoal, ...setup }),
    2,
  );
  const shop = openShop(run.game).game;
  return { shop, next: nextStage(shop).game };
};

const runOf = (game: Game) => {
  const { rng: _rng, stageNumber: _stageNumber, ...rest } = game.run;
  return rest;
};

describe("nextStage", () => {
  it("次のステージの開始待ちになり、ステージ番号が1増える", () => {
    const { next } = toNextStage();
    expect(next.phase).toBe("awaitingStart");
    expect(next.run.stageNumber).toBe(2);
  });

  it("長さ、HP、PP、累計獲得PP、スコア、モジュールは持ち越す", () => {
    const { shop, next } = toNextStage({ hp: 2, modules: ["revive"] });
    expect(runOf(next)).toEqual(runOf(shop));
  });

  it("ステージは作り直し、頭だけが中央にあり、ゴールもハートもなく、残り時間は制限時間いっぱい", () => {
    const stage = stageOf(toNextStage().next);
    expect(stage).toMatchObject({
      body: [CENTER],
      goal: null,
      hearts: [],
      batteriesEaten: 0,
      ppEarned: 0,
      timeLimitMs: CONFIG.timeLimitMs,
      remainingMs: CONFIG.timeLimitMs,
    });
    expect(DEFAULT_TUNING.wallPatterns.map((p) => placeWallPattern(p, TEST_TUNING.config.boardSize))).toContainEqual(
      stage.walls,
    );
  });

  it("制限時間+5秒を持っていると、持っている数だけ制限時間が延び、モジュールは残る", () => {
    const { next } = toNextStage({ modules: ["timeLimitPlus5s", "timeLimitPlus5s"] });
    expect(stageOf(next).timeLimitMs).toBe(CONFIG.timeLimitMs + 2 * CONFIG.timeLimitPlusMs);
    expect(stageOf(next).remainingMs).toBe(stageOf(next).timeLimitMs);
    expect(next.run.modules).toEqual(["timeLimitPlus5s", "timeLimitPlus5s"]);
  });

  it("制限時間の一時延長は、次のステージの制限時間を延ばして消費される", () => {
    const shop = openShop(cleared()).game;
    const boosted: Game = { ...shop, run: { ...shop.run, modules: ["timeLimitBoostNextStage"] } };
    const next = nextStage(boosted).game;
    expect(stageOf(next).timeLimitMs).toBe(CONFIG.timeLimitMs + CONFIG.timeLimitBoostMs);
    expect(next.run.modules).toEqual([]);
  });

  it("PP2倍のバッテリーを持っていると、ステージの最初のバッテリーもときどきPP2倍になる", () => {
    const kinds = Array.from({ length: 50 }, (_, i) => {
      const shop = openShop(cleared({ modules: ["doublePpBattery"] }, i + 1)).game;
      return stageOf(nextStage(shop).game).batteryKind;
    });
    expect(kinds).toContain("doublePp");
    expect(kinds).toContain("normal");
  });

  it("モジュールの画面以外で呼ぶと何も変わらない", () => {
    const game = cleared();
    expect(nextStage(game)).toEqual({ game, events: [] });
  });
});
