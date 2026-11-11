import { describe, expect, test } from "vite-plus/test";
import { pause, startRun } from "../logic/game";
import { begin, cleared, tick } from "../logic/testing";
import { INITIAL_VIEW, menuOffersGiveUp, screenOf } from "./view";

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

describe("menuOffersGiveUp", () => {
  test("ステージの開始待ちと止まっているときは、諦めるを出す", () => {
    expect(menuOffersGiveUp(inGame, startRun(1))).toBe(true);
    expect(menuOffersGiveUp(inGame, pause(begin("right")).game)).toBe(true);
  });

  test("タイトル、クリアのモーダル、ゲームオーバーでは、諦めるを出さない", () => {
    expect(menuOffersGiveUp(INITIAL_VIEW, startRun(1))).toBe(false);
    expect(menuOffersGiveUp(inGame, cleared())).toBe(false);
    expect(menuOffersGiveUp(inGame, gameOver)).toBe(false);
  });
});
