import { describe, expect, test } from "vitest";
import { CONFIG } from "../config";
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
});
