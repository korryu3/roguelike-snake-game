import { describe, expect, it } from "vite-plus/test";
import { CONFIG } from "../config";
import { startRun, step } from "./game";
import { begin, FAR_CORNER, headOf, stageOf, tick, ticks } from "./testing";

describe("step: 開始と移動", () => {
  it("開始待ちのあいだは時間が減らない", () => {
    const game = startRun(1, { walls: [], battery: FAR_CORNER });
    const next = step(game, [], 5_000).game;
    expect(next.phase).toBe("awaitingStart");
    expect(stageOf(next).remainingMs).toBe(CONFIG.timeLimitMs);
  });

  it("開始待ちで方向を押すとステージ中になり、その方向を向く", () => {
    const game = begin("right");
    expect(game.phase).toBe("playing");
    if (game.phase !== "playing") return;
    expect(game.movement.direction).toBe("right");
  });

  it("移動間隔ぶんの時間が溜まると1マス進む", () => {
    const next = tick(begin("right")).game;
    expect(headOf(next)).toEqual({ x: 8, y: 7 });
  });

  it("移動間隔に満たなければ進まない", () => {
    const next = step(begin("right"), [], CONFIG.moveIntervalMs - 1).game;
    expect(headOf(next)).toEqual({ x: 7, y: 7 });
    expect(headOf(step(next, [], 1).game)).toEqual({ x: 8, y: 7 });
  });

  it("制限時間は経過ミリ秒ぶん減る", () => {
    const next = step(begin("right"), [], 100).game;
    expect(stageOf(next).remainingMs).toBe(CONFIG.timeLimitMs - 100);
  });

  it("体は中央から1マスずつ出てきて、長さまで伸び、それ以上は伸びない", () => {
    const game = begin("right");
    expect(stageOf(ticks(game, 1).game).body).toEqual([
      { x: 8, y: 7 },
      { x: 7, y: 7 },
    ]);
    expect(stageOf(ticks(game, 4).game).body).toEqual([
      { x: 11, y: 7 },
      { x: 10, y: 7 },
      { x: 9, y: 7 },
    ]);
  });

  it("溜まった入力の方向へ、次の移動で曲がる", () => {
    const next = tick(begin("right"), ["down"]).game;
    expect(headOf(next)).toEqual({ x: 7, y: 8 });
  });

  it("入力は2つまで溜まり、3つ目以降は捨てられる", () => {
    const queued = step(begin("right"), ["down", "left", "up"], 0).game;
    expect(headOf(ticks(queued, 3).game)).toEqual({ x: 5, y: 8 });
  });

  it("真後ろへの入力は無視する", () => {
    const moved = tick(begin("right")).game;
    expect(headOf(tick(moved, ["left"]).game)).toEqual({ x: 9, y: 7 });
  });
});
