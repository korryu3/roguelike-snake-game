import { describe, expect, it } from "vitest";
import { CONFIG } from "../config";
import { giveUp, revive, step } from "../logic/game";
import { begin, tick, TEST_TUNING } from "../logic/testing";
import type { Game } from "../logic/types";
import { bgmLevel, soundsFor } from "./cues";

const sounds = (prev: Game, result: { game: Game; events: Parameters<typeof soundsFor>[2] }) => soundsFor(prev, result.game, result.events);

const AHEAD = { x: 8, y: 7 };

/** HP1で壁にぶつかり、生き返るモーダルになったところ */
const dying = () => tick(begin("right", { walls: [AHEAD], hp: 1, modules: ["revive"] })).game;

describe("soundsFor", () => {
  it("バッテリーを食べたら、取る音", () => {
    const prev = begin("right", { battery: AHEAD });
    expect(sounds(prev, tick(prev))).toEqual(["pickup"]);
  });

  it("ハートを取ったら、取る音", () => {
    const prev = begin("right", { hearts: [AHEAD] });
    expect(sounds(prev, tick(prev))).toEqual(["pickup"]);
  });

  it("壁や体にぶつかったら、ぶつかる音", () => {
    const prev = begin("right", { walls: [AHEAD] });
    expect(sounds(prev, tick(prev))).toEqual(["hit"]);
  });

  it("ゴールが出たら、ゴールの音も鳴る", () => {
    const prev = begin("right", { battery: AHEAD, batteriesEaten: CONFIG.batteriesToGoal - 1 });
    expect(sounds(prev, tick(prev))).toEqual(["pickup", "goal"]);
  });

  it("生き返ったら、生き返る音", () => {
    const prev = dying();
    expect(sounds(prev, revive(prev, "revive"))).toEqual(["revive"]);
  });

  it("ステージクリアになったら、クリアの音", () => {
    const prev = begin("right", { goal: AHEAD, batteriesEaten: CONFIG.batteriesToGoal });
    expect(sounds(prev, tick(prev))).toEqual(["clear"]);
  });

  it("HPが0でゲームオーバーになったら、ぶつかる音とゲームオーバーの音", () => {
    const prev = begin("right", { walls: [AHEAD], hp: 1 });
    expect(sounds(prev, tick(prev))).toEqual(["hit", "gameOver"]);
  });

  it("タイムアップでゲームオーバーになったら、ゲームオーバーの音", () => {
    const prev = begin("right", { tuning: TEST_TUNING });
    expect(sounds(prev, step(prev, [], CONFIG.timeLimitMs))).toEqual(["gameOver"]);
  });

  it("諦めてゲームオーバーになったら、ゲームオーバーの音", () => {
    const prev = dying();
    expect(sounds(prev, giveUp(prev))).toEqual(["gameOver"]);
  });

  it("何も起きなければ、音なし", () => {
    const prev = begin("right");
    expect(sounds(prev, tick(prev))).toEqual([]);
  });
});

describe("bgmLevel", () => {
  it("ステージ中は元の音量", () => {
    for (const phase of ["awaitingStart", "playing", "reviveChoice"] as const) expect(bgmLevel(false, phase)).toBe("normal");
  });

  it("クリアのモーダルとモジュールの画面とゲームオーバーでは下げる", () => {
    for (const phase of ["cleared", "shop", "gameOver"] as const) expect(bgmLevel(false, phase)).toBe("ducked");
  });

  it("タイトルでは下げる", () => {
    expect(bgmLevel(true, "awaitingStart")).toBe("ducked");
  });
});
