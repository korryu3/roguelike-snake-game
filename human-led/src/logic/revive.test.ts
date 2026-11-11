import { describe, expect, it } from "vite-plus/test";
import { CONFIG } from "../config";
import { giveUp, pause, revive, startRun, step } from "./game";
import { begin, CENTER, cleared, stageOf, ticks } from "./testing";
import type { Game, ModuleId } from "./types";

/** 中央から右へ2マス進み、HP1で壁にぶつかって、生き返るモーダルになったところ */
const dying = (modules: readonly ModuleId[]) => {
  const setup = { walls: [{ x: 10, y: 7 }], hp: 1, modules, goal: { x: 2, y: 2 }, hearts: [{ x: 3, y: 3 }] };
  const game = ticks(begin("right", setup), 3).game;
  if (game.phase !== "reviveChoice") throw new Error(`生き返るモーダルではない: ${game.phase}`);
  return game;
};

const movementOf = (game: Game) => {
  if (game.phase !== "playing") throw new Error(`ステージ中ではない: ${game.phase}`);
  return game.movement;
};

describe("revive", () => {
  it("1回生き返るで生き返ると、HP満タンになり、モジュールを1つ消費する", () => {
    const before = dying(["revive", "revive", "reviveAtOneHp"]);
    const { game, events } = revive(before, "revive");
    expect(game.run.hp).toBe(CONFIG.initialHp);
    expect(game.run.modules).toEqual(["revive", "reviveAtOneHp"]);
    expect(events).toEqual([{ type: "revived" }]);
  });

  it("生き返ると、ステージ開始待ちになり、中央のマスに頭だけが置かれる", () => {
    const { game } = revive(dying(["revive"]), "revive");
    expect(game.phase).toBe("awaitingStart");
    expect(stageOf(game).body).toEqual([CENTER]);
  });

  it("生き返っても、長さ・壁・バッテリー・ゴール・ハート・残り時間は変わらない", () => {
    const before = dying(["revive"]);
    const { game } = revive(before, "revive");
    expect(game.run.length).toBe(before.run.length);
    const { body: _before, ...rest } = before.stage;
    expect(stageOf(game)).toMatchObject(rest);
  });

  it("生き返ったあと、方向キーを押すまで残り時間は減らない", () => {
    const revived = revive(dying(["revive"]), "revive").game;
    const { game } = step(revived, [], 10_000);
    expect(stageOf(game).remainingMs).toBe(stageOf(revived).remainingMs);
  });

  it("生き返ったあと動き出しても、無敵時間はない", () => {
    const revived = revive(dying(["revive"]), "revive").game;
    const { game } = step(revived, ["up"], 0);
    expect(movementOf(game).invincibleMs).toBe(0);
  });

  it("満タンは、HPの上限+1で増えた上限まで", () => {
    const { game } = revive(dying(["revive", "maxHpPlus1"]), "revive");
    expect(game.run.hp).toBe(CONFIG.initialHp + 1);
  });

  it("1回生き返る（デメリット付き）で生き返ると、HP1", () => {
    const { game } = revive(dying(["reviveAtOneHp"]), "reviveAtOneHp");
    expect(game.run.hp).toBe(1);
    expect(game.run.modules).toEqual([]);
  });

  it("持っていない、または生き返るものではないモジュールでは生き返れない", () => {
    const before = dying(["reviveAtOneHp", "timeLimitPlus5s"]);
    expect(revive(before, "revive")).toEqual({ game: before, events: [] });
    expect(revive(before, "timeLimitPlus5s")).toEqual({ game: before, events: [] });
  });

  it("生き返るモーダル以外で呼ぶと何も変わらない", () => {
    const game = begin("right", { modules: ["revive"] });
    expect(revive(game, "revive")).toEqual({ game, events: [] });
  });
});

describe("giveUp", () => {
  it("諦めるとゲームオーバー（死因HP）", () => {
    const { game } = giveUp(dying(["revive"]));
    expect(game).toMatchObject({ phase: "gameOver", cause: "hp" });
  });

  it("一時停止から諦めると、ゲームオーバー（死因は諦めた）", () => {
    const { game } = giveUp(pause(begin("right")).game);
    expect(game).toMatchObject({ phase: "gameOver", cause: "gaveUp" });
  });

  it("開始待ちから諦めると、ゲームオーバー（死因は諦めた）", () => {
    const { game } = giveUp(startRun(1));
    expect(game).toMatchObject({ phase: "gameOver", cause: "gaveUp" });
  });

  it("動いている最中やクリアのモーダルなど、ほかの局面で呼ぶと何も変わらない", () => {
    for (const game of [begin("right"), cleared()]) expect(giveUp(game)).toEqual({ game, events: [] });
  });
});

describe("step: 生き返るモーダル", () => {
  it("生き返るモーダルのあいだは時間が減らない", () => {
    const before = dying(["revive"]);
    const { game } = step(before, ["up"], 10_000);
    expect(game).toEqual(before);
  });
});
