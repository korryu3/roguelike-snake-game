import { describe, expect, it } from "vitest";
import { CONFIG } from "../config";
import { step } from "./game";
import { begin, headOf, stageOf, tick, ticks } from "./testing";
import type { Game } from "./types";

const movementOf = (game: Game) => {
  if (game.phase !== "playing") throw new Error(`ステージ中ではない: ${game.phase}`);
  return game.movement;
};

const WALLS_LEAVING_ONLY_LEFT = [
  { x: 8, y: 7 },
  { x: 7, y: 6 },
  { x: 7, y: 8 },
];

describe("step: ぶつかる", () => {
  it("壁にぶつかるとHP-1、イベント、止まる。体の長さは変わらない", () => {
    const before = begin("right", { walls: [{ x: 8, y: 7 }] });
    const { game, events } = tick(before);
    expect(events).toContainEqual({ type: "collided", obstacle: "wall", damaged: true });
    expect(game.run.hp).toBe(CONFIG.initialHp - 1);
    expect(stageOf(game).body).toEqual(stageOf(before).body);
    expect(movementOf(game).motion.kind).toBe("stunned");
  });

  it("盤面の外へ出ようとすると壁と同じくぶつかる", () => {
    const { game, events } = ticks(begin("right"), 8);
    expect(events).toContainEqual({ type: "collided", obstacle: "wall", damaged: true });
    expect(game.run.hp).toBe(CONFIG.initialHp - 1);
  });

  it("自分の体にぶつかるとHP-1", () => {
    let game = ticks(begin("right", { length: 5 }), 4).game;
    game = tick(game, ["down"]).game;
    game = tick(game, ["left"]).game;
    const { game: hit, events } = tick(game, ["up"]);
    expect(events).toContainEqual({ type: "collided", obstacle: "body", damaged: true });
    expect(hit.run.hp).toBe(CONFIG.initialHp - 1);
  });

  it("尻尾が抜けるマスへは、ぶつからずに進める", () => {
    let game = ticks(begin("right", { length: 4 }), 3).game;
    game = tick(game, ["down"]).game;
    game = tick(game, ["left"]).game;
    const { game: moved, events } = tick(game, ["up"]);
    expect(events.filter((e) => e.type === "collided")).toEqual([]);
    expect(headOf(moved)).toEqual({ x: 9, y: 7 });
  });

  it("止まっているあいだは進まないが、制限時間は減る", () => {
    const hit = tick(begin("right", { walls: [{ x: 8, y: 7 }] })).game;
    const later = tick(hit).game;
    expect(headOf(later)).toEqual(headOf(hit));
    expect(stageOf(later).remainingMs).toBe(stageOf(hit).remainingMs - CONFIG.moveIntervalMs);
  });

  it("止まる時間が過ぎると、溜まった入力の最後の方向へ動き出す", () => {
    const hit = tick(begin("right", { walls: [{ x: 8, y: 7 }] })).game;
    const resumed = step(hit, ["up", "left"], CONFIG.stunMs).game;
    expect(headOf(tick(resumed).game)).toEqual({ x: 6, y: 7 });
  });

  it("入力がなければ、すぐ先が壁でも体でもない方向へ動き出す", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const hit = tick(begin("right", { walls: WALLS_LEAVING_ONLY_LEFT }, seed)).game;
      const resumed = step(hit, [], CONFIG.stunMs).game;
      expect(headOf(tick(resumed).game)).toEqual({ x: 6, y: 7 });
    }
  });

  it("動き出してから無敵時間のあいだにぶつかってもHPは減らず、止まらず、向きを変える", () => {
    const walls = [...WALLS_LEAVING_ONLY_LEFT, { x: 5, y: 7 }];
    const hit = tick(begin("right", { walls })).game;
    const resumed = step(hit, [], CONFIG.stunMs).game;
    const { game, events } = ticks(resumed, 2);
    expect(events).toContainEqual({ type: "collided", obstacle: "wall", damaged: false });
    expect(game.run.hp).toBe(hit.run.hp);
    expect(movementOf(game).motion.kind).toBe("moving");
    expect(["up", "down"]).toContain(movementOf(game).direction);
  });

  it("無敵時間が過ぎたあとにぶつかるとHPが減る", () => {
    const hit = tick(begin("right", { walls: WALLS_LEAVING_ONLY_LEFT })).game;
    let game = ticks(step(hit, [], CONFIG.stunMs).game, 3).game;
    game = tick(game, ["down"]).game;
    game = ticks(game, 6).game;
    const { game: hitAgain, events } = tick(game);
    expect(events).toContainEqual({ type: "collided", obstacle: "wall", damaged: true });
    expect(hitAgain.run.hp).toBe(hit.run.hp - 1);
  });
});

/** 長さ7で右に6マス進み、Uの字に折り返して(12,7)の体にぶつかる直前 */
const beforeBodyHit = () => {
  let game = ticks(begin("right", { length: 7 }), 6).game;
  game = tick(game, ["down"]).game;
  return tick(game, ["left"]).game;
};

describe("step: 体をすり抜ける", () => {
  it("体にぶつかるとHP-1、イベント、止まらずに体のマスへ進む", () => {
    const { game, events } = tick(beforeBodyHit(), ["up"]);
    expect(events).toContainEqual({ type: "collided", obstacle: "body", damaged: true });
    expect(game.run.hp).toBe(CONFIG.initialHp - 1);
    expect(movementOf(game).motion.kind).toBe("moving");
    expect(headOf(game)).toEqual({ x: 12, y: 7 });
  });

  it("体にぶつかると無敵時間が付く", () => {
    const { game } = tick(beforeBodyHit(), ["up"]);
    expect(movementOf(game).invincibleMs).toBe(CONFIG.invincibleMs);
  });

  it("体の上を続けて進んでも、HPはそれ以上減らない", () => {
    const hit = tick(beforeBodyHit(), ["up"]).game;
    const { game } = tick(hit, ["left"]);
    expect(headOf(game)).toEqual({ x: 11, y: 7 });
    expect(game.run.hp).toBe(CONFIG.initialHp - 1);
  });

  it("無敵時間中に体へ入ると、向きを変えずに体のマスへ進む", () => {
    const hit = tick(beforeBodyHit(), ["up"]).game;
    const { game } = tick(hit, ["left"]);
    expect(movementOf(game).direction).toBe("left");
    expect(headOf(game)).toEqual({ x: 11, y: 7 });
  });
});

describe("step: 動き出す方向の順番", () => {
  it("壁でも体でもない方向がなければ、体の方向のうち真後ろ以外へ動き出す", () => {
    // (8,7)→(8,8)→(7,8)→(6,8)→(6,7)と進み、上の壁にぶつかる。左は壁、右は体、下は首
    const walls = [
      { x: 6, y: 6 },
      { x: 5, y: 7 },
    ];
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      let game = tick(begin("right", { walls, length: 7 }, seed)).game;
      game = tick(game, ["down"]).game;
      game = tick(game, ["left"]).game;
      game = tick(game).game;
      game = tick(game, ["up"]).game;
      const hit = tick(game).game;
      expect(movementOf(hit).motion.kind).toBe("stunned");
      expect(movementOf(step(hit, [], CONFIG.stunMs).game).direction).toBe("right");
    }
  });

  it("真後ろ以外がすべて壁なら、真後ろへ動き出す", () => {
    const walls = [
      { x: 9, y: 7 },
      { x: 8, y: 6 },
      { x: 8, y: 8 },
    ];
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const hit = tick(tick(begin("right", { walls }, seed)).game).game;
      expect(movementOf(hit).motion.kind).toBe("stunned");
      expect(movementOf(step(hit, [], CONFIG.stunMs).game).direction).toBe("left");
    }
  });

  it("無敵時間中に壁にぶつかったときも、同じ順で向きを変える", () => {
    // (8,7)で右の壁にぶつかり、上へ動き出す。(8,6)では上・左・右が壁で、下が首
    const walls = [
      { x: 9, y: 7 },
      { x: 8, y: 8 },
      { x: 8, y: 5 },
      { x: 7, y: 6 },
      { x: 9, y: 6 },
    ];
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const hit = ticks(begin("right", { walls }, seed), 2).game;
      expect(movementOf(hit).motion.kind).toBe("stunned");
      const resumed = step(hit, ["up"], CONFIG.stunMs).game;
      const { game, events } = ticks(resumed, 2);
      expect(events).toContainEqual({ type: "collided", obstacle: "wall", damaged: false });
      expect(movementOf(game).direction).toBe("down");
    }
  });
});
