import { describe, expect, it } from "vitest";
import { CONFIG } from "../config";
import { giveUp, revive, step } from "./game";
import { begin, stageOf, tick } from "./testing";
import type { Game, ModuleId } from "./types";

/** HP1で壁にぶつかり、生き返るモーダルになったところ */
const dying = (modules: readonly ModuleId[]) => {
  const game = tick(begin("right", { walls: [{ x: 8, y: 7 }], hp: 1, modules })).game;
  if (game.phase !== "reviveChoice") throw new Error(`生き返るモーダルではない: ${game.phase}`);
  return game;
};

const movementOf = (game: Game) => {
  if (game.phase !== "playing") throw new Error(`ステージ中ではない: ${game.phase}`);
  return game.movement;
};

describe("revive", () => {
  it("1回生き返るで生き返ると、HP満タンで、その場から無敵時間付きで再開し、モジュールを1つ消費する", () => {
    const before = dying(["revive", "revive", "reviveAtOneHp"]);
    const { game, events } = revive(before, "revive");
    expect(game.phase).toBe("playing");
    expect(game.run.hp).toBe(CONFIG.initialHp);
    expect(game.run.modules).toEqual(["revive", "reviveAtOneHp"]);
    expect(stageOf(game).body).toEqual(before.stage.body);
    expect(movementOf(game).invincibleMs).toBe(CONFIG.invincibleMs);
    expect(events).toEqual([{ type: "revived" }]);
  });

  it("満タンは、HPの上限+1で増えた上限まで", () => {
    const { game } = revive(dying(["revive", "maxHpPlus1"]), "revive");
    expect(game.run.hp).toBe(CONFIG.initialHp + 1);
  });

  it("1回生き返る（デメリット付き）で生き返ると、HP1", () => {
    const { game } = revive(dying(["reviveAtOneHp"]), "reviveAtOneHp");
    expect(game.phase).toBe("playing");
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

  it("生き返るモーダル以外で呼ぶと何も変わらない", () => {
    const game = begin("right");
    expect(giveUp(game)).toEqual({ game, events: [] });
  });
});

describe("step: 生き返るモーダル", () => {
  it("生き返るモーダルのあいだは時間が減らない", () => {
    const before = dying(["revive"]);
    const { game } = step(before, ["up"], 10_000);
    expect(game).toEqual(before);
  });
});
