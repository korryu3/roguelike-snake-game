import { describe, expect, it } from "vite-plus/test";
import { CONFIG } from "../config";
import { step } from "./game";
import { begin, headOf, stageOf, tick, ticks } from "./testing";
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

describe("step: 移動速度アップ・ダウン", () => {
  const advancedBy = (modules: readonly ModuleId[], ms: number) =>
    headOf(step(begin("right", { modules }), [], ms).game);
  const START = { x: 7, y: 7 };
  const MOVED = { x: 8, y: 7 };

  it("移動速度アップを持つと、移動の間隔が1.5分の1になる", () => {
    expect(advancedBy(["fasterMovement"], 99)).toEqual(START);
    expect(advancedBy(["fasterMovement"], 100)).toEqual(MOVED);
  });

  it("移動速度ダウンを持つと、移動の間隔が0.75分の1になる", () => {
    expect(advancedBy(["slowerMovement"], 199)).toEqual(START);
    expect(advancedBy(["slowerMovement"], 200)).toEqual(MOVED);
  });

  it("両方持つと、倍率を掛け合わせる", () => {
    expect(advancedBy(["fasterMovement", "slowerMovement"], 133)).toEqual(START);
    expect(advancedBy(["fasterMovement", "slowerMovement"], 134)).toEqual(MOVED);
  });
});

describe("step: 体の切断", () => {
  /**
   * 右に4マス進んでから下・左・上と回り、自分の体の(10,7)にぶつかる。
   * ぶつかる直前の体は[(10,8),(11,8),(11,7),(10,7),(9,7)]で、(10,7)は頭から4つ目
   */
  const loopIntoBody = (game: Game) => {
    game = ticks(game, 4).game;
    game = tick(game, ["down"]).game;
    game = tick(game, ["left"]).game;
    return tick(game, ["up"]);
  };
  const CUT_BODY = [
    { x: 10, y: 7 },
    { x: 10, y: 8 },
    { x: 11, y: 8 },
    { x: 11, y: 7 },
  ];

  it("自分の体にぶつかると、HPは減らず、ぶつかった位置から尻尾までが消える", () => {
    const { game } = loopIntoBody(begin("right", { length: 5, modules: ["bodyCut"] }));
    expect(game.run.hp).toBe(CONFIG.initialHp);
    expect(stageOf(game).body).toEqual(CUT_BODY);
  });

  it("切ったあとのランの長さは、残った体の長さになる", () => {
    const { game } = loopIntoBody(begin("right", { length: 5, modules: ["bodyCut"] }));
    expect(game.run.length).toBe(CUT_BODY.length);
  });

  it("体がまだ伸びきっていないときも、残った体の長さがランの長さになる", () => {
    const { game } = loopIntoBody(begin("right", { length: 10, modules: ["bodyCut"] }));
    expect(game.run.length).toBe(CUT_BODY.length);
  });

  it("1回切ると1つ消費する", () => {
    const { game } = loopIntoBody(begin("right", { length: 5, modules: ["bodyCut", "bodyCut"] }));
    expect(game.run.modules).toEqual(["bodyCut"]);
  });

  it("止まらずに、そのまま進み続ける", () => {
    const cut = loopIntoBody(begin("right", { length: 5, modules: ["bodyCut"] })).game;
    expect(movementOf(cut).motion.kind).toBe("moving");
    expect(headOf(tick(cut).game)).toEqual({ x: 10, y: 6 });
  });

  it("切ったことを表すイベントが出る", () => {
    const { events } = loopIntoBody(begin("right", { length: 5, modules: ["bodyCut"] }));
    expect(events).toContainEqual({ type: "bodyCut" });
  });

  it("無敵時間中にぶつかったときも切る", () => {
    // 右の壁にぶつかって止まり、下へ動き出した直後（無敵時間中）に体へぶつかる
    let game = ticks(begin("right", { length: 5, walls: [{ x: 12, y: 7 }], modules: ["bodyCut"] }), 5).game;
    game = step(game, ["down"], CONFIG.stunMs).game;
    expect(movementOf(game).invincibleMs).toBeGreaterThan(0);
    game = tick(game).game;
    game = tick(game, ["left"]).game;
    const { game: cut, events } = tick(game, ["up"]);
    expect(events).toContainEqual({ type: "bodyCut" });
    expect(stageOf(cut).body).toEqual(CUT_BODY);
  });

  it("壁にぶつかったときは使わない", () => {
    const { game } = tick(begin("right", { walls: [{ x: 8, y: 7 }], modules: ["bodyCut"] }));
    expect(game.run.hp).toBe(CONFIG.initialHp - 1);
    expect(game.run.modules).toEqual(["bodyCut"]);
  });
});
