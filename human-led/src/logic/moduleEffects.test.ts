import { describe, expect, it } from "vite-plus/test";
import { CONFIG } from "../config";
import { begin, stageOf, tick, ticks } from "./testing";
import type { Game, ModuleId, RunSetup } from "./types";

const AHEAD = { x: 8, y: 7 };
const seeds = Array.from({ length: 50 }, (_, i) => i + 1);

const eatAhead = (setup: RunSetup = {}, seed = 1) => tick(begin("right", { battery: AHEAD, ...setup }, seed));

/** すぐ右のバッテリーを食べてから、その先のゴールに入る */
const eatThenClear = (setup: RunSetup) => {
  const { game } = ticks(
    begin("right", { battery: AHEAD, goal: { x: 9, y: 7 }, batteriesEaten: CONFIG.batteriesToGoal, ...setup }),
    2,
  );
  if (game.phase !== "cleared") throw new Error(`クリアの局面ではない: ${game.phase}`);
  return game.summary;
};

const movementOf = (game: Game) => {
  if (game.phase !== "playing") throw new Error(`ステージ中ではない: ${game.phase}`);
  return game.movement;
};

describe("step: PP・伸び2倍", () => {
  it("持っていると、バッテリー1個でPPが2倍、長さが2伸びる", () => {
    const { game } = eatAhead({ modules: ["doublePpAndGrowth"] });
    expect(game.run).toMatchObject({
      pp: 2 * CONFIG.ppPerBattery,
      totalPp: 2 * CONFIG.ppPerBattery,
      length: CONFIG.initialLength + 2,
    });
    expect(stageOf(game).ppEarned).toBe(2 * CONFIG.ppPerBattery);
  });

  it("2つ持っていると3倍になる", () => {
    const { game } = eatAhead({ modules: ["doublePpAndGrowth", "doublePpAndGrowth"] });
    expect(game.run).toMatchObject({ pp: 3 * CONFIG.ppPerBattery, length: CONFIG.initialLength + 3 });
  });

  it("持っていても、スコアのバッテリーの分は増えない", () => {
    const summary = eatThenClear({ modules: ["doublePpAndGrowth"] });
    expect(summary.batteryScore).toBe((CONFIG.batteriesToGoal + 1) * CONFIG.scorePerBattery);
  });
});

describe("step: 壁ダメージ無効", () => {
  const hitWall = (modules: readonly ModuleId[]) => tick(begin("right", { walls: [AHEAD], modules }));

  it("壁にぶつかってもHPは減らず、ダメージのときと同じく止まり、1つ消費する", () => {
    const { game, events } = hitWall(["wallDamageImmunity", "wallDamageImmunity"]);
    expect(game.run.hp).toBe(CONFIG.initialHp);
    expect(movementOf(game).motion.kind).toBe("stunned");
    expect(game.run.modules).toEqual(["wallDamageImmunity"]);
    expect(events).toContainEqual({ type: "collided", obstacle: "wall", damaged: false });
  });

  it("持っていても、体にぶつかるとHPが減り、消費しない", () => {
    let game = ticks(begin("right", { length: 5, modules: ["wallDamageImmunity"] }), 4).game;
    game = tick(game, ["down"]).game;
    game = tick(game, ["left"]).game;
    const { game: hit, events } = tick(game, ["up"]);
    expect(events).toContainEqual({ type: "collided", obstacle: "body", damaged: true });
    expect(hit.run.hp).toBe(CONFIG.initialHp - 1);
    expect(hit.run.modules).toEqual(["wallDamageImmunity"]);
  });
});

describe("step: PP2倍のバッテリー", () => {
  it("PP2倍のバッテリーを食べるとPPが2倍になる", () => {
    const { game } = eatAhead({ batteryKind: "doublePp" });
    expect(game.run).toMatchObject({ pp: 2 * CONFIG.ppPerBattery, length: CONFIG.initialLength + 1 });
  });

  it("PP2倍のバッテリーでも、スコアのバッテリーの分は2倍にならない", () => {
    const summary = eatThenClear({ batteryKind: "doublePp" });
    expect(summary.batteryScore).toBe((CONFIG.batteriesToGoal + 1) * CONFIG.scorePerBattery);
  });

  it("モジュールを持っていると、次のバッテリーがときどきPP2倍になる", () => {
    const kinds = seeds.map((seed) => stageOf(eatAhead({ modules: ["doublePpBattery"] }, seed).game).batteryKind);
    expect(kinds).toContain("doublePp");
    expect(kinds).toContain("normal");
  });

  it("モジュールを持っていなければ、PP2倍のバッテリーは出ない", () => {
    const kinds = seeds.map((seed) => stageOf(eatAhead({}, seed).game).batteryKind);
    expect(kinds.every((kind) => kind === "normal")).toBe(true);
  });
});
