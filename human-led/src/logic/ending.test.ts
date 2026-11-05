import { describe, expect, it } from "vitest";
import { CONFIG, MODULES } from "../config";
import { nextStage, step } from "./game";
import { buyModule, openShop } from "./shop";
import { begin, tick, ticks } from "./testing";
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

  it("ゲームオーバーから、到達ステージ、スコア、死因、累計獲得PP、残りPP、長さ、買ったモジュールが読める", () => {
    const setup = { battery: { x: 8, y: 7 }, goal: { x: 9, y: 7 }, batteriesEaten: CONFIG.batteriesToGoal, pp: 100 };
    const firstStage = ticks(begin("right", setup), 2).game;
    const shop = openShop(firstStage).game;
    const bought = buyModule(shop, 0).game;
    const [module] = bought.run.purchased;
    if (module === undefined) throw new Error("買えていない");
    const secondStage = step(nextStage(bought).game, ["up"], 0).game;
    const { game } = step(secondStage, [], 10 * CONFIG.timeLimitMs);
    expect(game).toMatchObject({
      phase: "gameOver",
      cause: "timeUp",
      run: {
        stageNumber: 2,
        score: firstStage.run.score,
        totalPp: CONFIG.ppPerBattery,
        pp: 100 + CONFIG.ppPerBattery - MODULES[module].price,
        length: CONFIG.initialLength + 1,
        purchased: [module],
      },
    });
  });

  it("残り時間が0になるとゲームオーバー（死因時間切れ）とイベント", () => {
    const { game, events } = step(begin("right"), [], CONFIG.timeLimitMs);
    expect(game).toMatchObject({ phase: "gameOver", cause: "timeUp" });
    expect(events).toContainEqual({ type: "timeUp" });
  });
});
