import { describe, expect, it } from "vitest";
import { CONFIG } from "../config";
import { pause, step } from "./game";
import { begin, cleared, headOf, stageOf, tick } from "./testing";
import type { Game } from "./types";

const paused = (game: Game) => {
  const result = pause(game).game;
  if (result.phase !== "paused") throw new Error(`止まった局面ではない: ${result.phase}`);
  return result;
};

const movementOf = (game: Game) => {
  if (game.phase !== "playing") throw new Error(`ステージ中ではない: ${game.phase}`);
  return game.movement;
};

describe("pause", () => {
  it("ステージ中に止めると、止まった局面になり、ランとステージと動きは変わらない", () => {
    const playing = tick(begin("right")).game;
    if (playing.phase !== "playing") throw new Error(playing.phase);
    const { game, events } = pause(playing);
    expect(game).toEqual({ phase: "paused", run: playing.run, stage: playing.stage, movement: playing.movement });
    expect(events).toEqual([]);
  });

  it("ステージ中以外で止めても、何も変わらない", () => {
    const game = cleared();
    expect(pause(game)).toEqual({ game, events: [] });
  });
});

describe("step: 止まっているとき", () => {
  it("時間が経っても何も変わらない", () => {
    const before = paused(tick(begin("right")).game);
    expect(step(before, [], 10_000)).toEqual({ game: before, events: [] });
  });

  it("真後ろの方向キーだけでは再開しない", () => {
    const before = paused(tick(begin("right")).game);
    expect(step(before, ["left"], 0)).toEqual({ game: before, events: [] });
  });

  it("方向キーを押すと、その方向へ向いて再開する。真後ろは飛ばして次の方向を使う", () => {
    const before = paused(tick(begin("right")).game);
    const resumed = step(before, ["left", "up"], 0).game;
    expect(movementOf(resumed).direction).toBe("up");
    expect(movementOf(resumed).queuedInputs).toEqual([]);
    const moved = tick(resumed).game;
    expect(headOf(moved)).toEqual({ x: 8, y: 6 });
    expect(stageOf(moved).remainingMs).toBe(stageOf(before).remainingMs - CONFIG.moveIntervalMs);
  });

  it("ぶつかって止まっているときに止めたら、再開しても止まる時間は残り、押した方向へ動き出す", () => {
    const hit = tick(begin("right", { walls: [{ x: 8, y: 7 }] })).game;
    const resumed = step(paused(hit), ["up"], 0).game;
    expect(movementOf(resumed).motion).toEqual(movementOf(hit).motion);
    const recovered = step(resumed, [], CONFIG.stunMs).game;
    expect(movementOf(recovered).direction).toBe("up");
  });
});
