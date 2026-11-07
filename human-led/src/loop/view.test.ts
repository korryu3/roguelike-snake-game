import { describe, expect, test } from "vite-plus/test";
import { pause, startRun } from "../logic/game";
import { begin, cleared, tick } from "../logic/testing";
import { INITIAL_VIEW, menuReturnsToStage, screenOf } from "./view";

const inGame = { ...INITIAL_VIEW, onTitle: false };
const gameOver = tick(begin("right", { walls: [{ x: 8, y: 7 }], hp: 1 })).game;

describe("screenOf", () => {
  test("タイトルにいるあいだは、ゲームの局面によらずタイトル", () => {
    expect(screenOf(INITIAL_VIEW, gameOver)).toBe("title");
  });

  test("タイトルの外では、ゲームオーバーならゲームオーバー、それ以外はステージ", () => {
    expect(screenOf(inGame, gameOver)).toBe("gameOver");
    expect(screenOf(inGame, begin("right"))).toBe("stage");
    expect(screenOf(inGame, cleared())).toBe("stage");
  });
});

describe("menuReturnsToStage", () => {
  test("ステージの開始待ちと止まっているときは、ステージに戻る", () => {
    expect(menuReturnsToStage(inGame, startRun(1))).toBe(true);
    expect(menuReturnsToStage(inGame, pause(begin("right")).game)).toBe(true);
  });

  test("タイトル、クリアのモーダル、ゲームオーバーでは、ステージに戻らない", () => {
    expect(menuReturnsToStage(INITIAL_VIEW, startRun(1))).toBe(false);
    expect(menuReturnsToStage(inGame, cleared())).toBe(false);
    expect(menuReturnsToStage(inGame, gameOver)).toBe(false);
  });
});
