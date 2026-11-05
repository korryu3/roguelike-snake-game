import { describe, expect, test } from "vitest";
import { CONFIG, DEFAULT_TUNING, type Tuning } from "../config";
import { startRun } from "../logic/game";
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

  test("ゲームオーバーでRを押すと、新しいシードでランを始め直す", () => {
    const session = createSession(seeds(1, 2));
    session.command({ kind: "direction", direction: "up" });
    session.advance(0);
    session.advance(CONFIG.timeLimitMs);
    expect(session.store.getSnapshot().phase).toBe("gameOver");
    session.command({ kind: "restart" });
    expect(session.store.getSnapshot()).toEqual(startRun(2));
  });

  test("ステージ中のRは無視する", () => {
    const session = createSession(seeds(1, 2));
    session.command({ kind: "direction", direction: "up" });
    session.advance(0);
    const playing = session.store.getSnapshot();
    session.command({ kind: "restart" });
    expect(session.store.getSnapshot()).toBe(playing);
  });

  describe("調整した数値", () => {
    const short: Tuning = { ...DEFAULT_TUNING, config: { ...DEFAULT_TUNING.config, timeLimitMs: 2_000 } };
    const fast: Tuning = { ...DEFAULT_TUNING, config: { ...DEFAULT_TUNING.config, moveIntervalMs: 50 } };

    test("渡した数値で最初のランを始める", () => {
      expect(createSession(seeds(1), short).store.getSnapshot()).toEqual(startRun(1, { tuning: short }));
    });

    test("Rでやり直すと、今のランの数値のまま新しいシードで始める", () => {
      const session = createSession(seeds(1, 2), short);
      session.command({ kind: "direction", direction: "up" });
      session.advance(0);
      session.advance(2_000);
      session.command({ kind: "restart" });
      expect(session.store.getSnapshot()).toEqual(startRun(2, { tuning: short }));
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
});
