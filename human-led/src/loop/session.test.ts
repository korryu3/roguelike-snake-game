import { describe, expect, test } from "vitest";
import { CONFIG, DEFAULT_TUNING, type Tuning } from "../config";
import { startRun } from "../logic/game";
import { openShop } from "../logic/shop";
import { begin, cleared, tick } from "../logic/testing";
import type { Game, ModuleId } from "../logic/types";
import { createSession } from "./session";

const seeds = (...values: number[]) => () => {
  const seed = values.shift();
  if (seed === undefined) throw new Error("シードが足りない");
  return seed;
};

describe("createSession", () => {
  test("最初はシードから始めたランの開始待ち", () => {
    expect(createSession(seeds(1)).store.getSnapshot()).toEqual(startRun(1));
  });

  test("方向を押して時間を進めると、ステージが始まる", () => {
    const session = createSession(seeds(1));
    session.command({ kind: "direction", direction: "up" });
    session.advance(0);
    expect(session.store.getSnapshot()).toMatchObject({ phase: "playing", movement: { direction: "up" } });
  });

  test("押した方向は1回の進行でだけ使われる", () => {
    const session = createSession(seeds(1));
    session.command({ kind: "direction", direction: "up" });
    session.advance(0);
    session.command({ kind: "direction", direction: "left" });
    session.advance(0);
    session.advance(CONFIG.moveIntervalMs);
    session.advance(CONFIG.moveIntervalMs);
    const game = session.store.getSnapshot();
    if (game.phase !== "playing") throw new Error(`ステージ中のはず: ${game.phase}`);
    expect(game.movement.queuedInputs).toEqual([]);
    expect(game.stage.body[0]).toEqual({ x: 5, y: 7 });
  });

  describe("調整した数値", () => {
    const short: Tuning = { ...DEFAULT_TUNING, config: { ...DEFAULT_TUNING.config, timeLimitMs: 2_000 } };
    const fast: Tuning = { ...DEFAULT_TUNING, config: { ...DEFAULT_TUNING.config, moveIntervalMs: 50 } };

    test("渡した数値で最初のランを始める", () => {
      expect(createSession(seeds(1), short).store.getSnapshot()).toEqual(startRun(1, { tuning: short }));
    });

    test("数値を指定して始め直すと、どの局面からでもその数値で新しいランになる", () => {
      const session = createSession(seeds(1, 2), short);
      session.command({ kind: "direction", direction: "up" });
      session.advance(0);
      session.restart(fast);
      expect(session.store.getSnapshot()).toEqual(startRun(2, { tuning: fast }));
    });
  });

  describe("調整パネル", () => {
    test("パネルを開くと、閉じるまで時間が進まず、方向の入力も受け付けない", () => {
      const session = createSession(seeds(1));
      session.command({ kind: "direction", direction: "up" });
      session.advance(0);
      const playing = session.store.getSnapshot();
      session.command({ kind: "togglePanel" });
      expect(session.panelOpen.getSnapshot()).toBe(true);
      session.command({ kind: "direction", direction: "left" });
      session.advance(1_000);
      expect(session.store.getSnapshot()).toBe(playing);
      session.command({ kind: "togglePanel" });
      expect(session.panelOpen.getSnapshot()).toBe(false);
      session.advance(0);
      const game = session.store.getSnapshot();
      if (game.phase !== "playing") throw new Error(game.phase);
      expect(game.movement.queuedInputs).toEqual([]);
    });

    test("始め直すとパネルが閉じる", () => {
      const session = createSession(seeds(1, 2));
      session.command({ kind: "togglePanel" });
      session.restart(DEFAULT_TUNING);
      expect(session.panelOpen.getSnapshot()).toBe(false);
    });
  });

  describe("画面の操作", () => {
    const sessionAt = (game: Game) => createSession(seeds(1), DEFAULT_TUNING, () => game);
    const shopWith = (pp: number) => openShop(cleared({ pp })).game;
    const dying = (modules: readonly ModuleId[]) => tick(begin("right", { walls: [{ x: 8, y: 7 }], hp: 1, modules })).game;

    test("クリアの局面でモジュールの画面を開ける", () => {
      const session = sessionAt(cleared());
      session.perform({ kind: "openShop" });
      expect(session.store.getSnapshot().phase).toBe("shop");
    });

    test("モジュールの画面で、候補を買える", () => {
      const session = sessionAt(shopWith(100));
      session.perform({ kind: "buy", offerIndex: 1 });
      const game = session.store.getSnapshot();
      if (game.phase !== "shop") throw new Error(game.phase);
      expect(game.offers.map((o) => o.sold)).toEqual([false, true, false]);
      expect(game.run.purchased).toEqual([game.offers[1]?.module]);
    });

    test("モジュールの画面で、リロールできる", () => {
      const session = sessionAt(shopWith(10));
      session.perform({ kind: "reroll" });
      expect(session.store.getSnapshot().run.pp).toBe(10 - CONFIG.rerollPrice);
    });

    test("モジュールの画面から次のステージへ進める", () => {
      const session = sessionAt(shopWith(0));
      session.perform({ kind: "nextStage" });
      expect(session.store.getSnapshot()).toMatchObject({ phase: "awaitingStart", run: { stageNumber: 2 } });
    });

    test("生き返るモーダルで、選んだモジュールで生き返る", () => {
      const session = sessionAt(dying(["revive", "reviveAtOneHp"]));
      session.perform({ kind: "revive", module: "reviveAtOneHp" });
      expect(session.store.getSnapshot()).toMatchObject({ phase: "awaitingStart", run: { hp: 1, modules: ["revive"] } });
    });

    test("生き返るモーダルで諦めると、ゲームオーバー", () => {
      const session = sessionAt(dying(["revive"]));
      session.perform({ kind: "giveUp" });
      expect(session.store.getSnapshot()).toMatchObject({ phase: "gameOver", cause: "hp" });
    });

    test("その局面でできない操作は何も変えない", () => {
      const session = sessionAt(startRun(1));
      const before = session.store.getSnapshot();
      for (const action of [{ kind: "openShop" }, { kind: "buy", offerIndex: 0 }, { kind: "nextStage" }, { kind: "giveUp" }] as const) {
        session.perform(action);
      }
      expect(session.store.getSnapshot()).toBe(before);
    });
  });
});
