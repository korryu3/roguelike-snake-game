import { describe, expect, it } from "vitest";
import { CONFIG } from "../config";
import { step } from "./game";
import { begin, tick } from "./testing";
import type { ModuleId } from "./types";

const WALL_AHEAD = [{ x: 8, y: 7 }];

describe("step: 終わり", () => {
  it("HPが0になり、生き返るモジュールがなければゲームオーバー（死因HP）とイベント", () => {
    const { game, events } = tick(begin("right", { walls: WALL_AHEAD, hp: 1, modules: ["timeLimitPlus5s"] }));
    expect(game).toMatchObject({ phase: "gameOver", cause: "hp" });
    expect(events).toContainEqual({ type: "hpDepleted" });
  });

  it("HPが0になり、生き返るモジュールがあれば生き返るモーダルになる", () => {
    const reviveModules: ModuleId[] = ["revive", "reviveAtOneHp"];
    for (const module of reviveModules) {
      const { game, events } = tick(begin("right", { walls: WALL_AHEAD, hp: 1, modules: [module] }));
      expect(game.phase).toBe("reviveChoice");
      expect(events).toContainEqual({ type: "hpDepleted" });
    }
  });

  it("残り時間が0になるとゲームオーバー（死因時間切れ）とイベント", () => {
    const { game, events } = step(begin("right"), [], CONFIG.timeLimitMs);
    expect(game).toMatchObject({ phase: "gameOver", cause: "timeUp" });
    expect(events).toContainEqual({ type: "timeUp" });
  });
});
