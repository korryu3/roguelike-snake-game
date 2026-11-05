import { describe, expect, it } from "vitest";
import { CONFIG, MODULES } from "../config";
import { openShop } from "./shop";
import { begin, cleared, offersOf } from "./testing";
import type { ModuleId } from "./types";

const ALL_MODULES = Object.keys(MODULES) as ModuleId[];
const seeds = Array.from({ length: 30 }, (_, i) => i + 1);

describe("openShop", () => {
  it("クリアの局面から呼ぶと、モジュールの画面になり、未購入の候補が3つ出る", () => {
    const { game } = openShop(cleared());
    expect(game.phase).toBe("shop");
    expect(offersOf(game)).toHaveLength(CONFIG.shopOfferCount);
    expect(offersOf(game).every((offer) => !offer.sold)).toBe(true);
  });

  it("候補の3つは互いに違うモジュール", () => {
    for (const seed of seeds) {
      const modules = offersOf(openShop(cleared({}, seed)).game).map((offer) => offer.module);
      expect(new Set(modules).size).toBe(modules.length);
    }
  });

  it("シードによって候補が変わる", () => {
    const sets = new Set(seeds.map((seed) => JSON.stringify(offersOf(openShop(cleared({}, seed)).game))));
    expect(sets.size).toBeGreaterThan(1);
  });

  it("重ねられる上限まで持っているモジュールは候補に出ない", () => {
    const left: ModuleId[] = ["revive", "timeLimitBoostNextStage", "doublePpBattery"];
    const maxed = ALL_MODULES.filter((id) => !left.includes(id)).flatMap((id) => Array<ModuleId>(MODULES[id].maxStack).fill(id));
    for (const seed of seeds) {
      const modules = offersOf(openShop(cleared({ modules: maxed }, seed)).game).map((offer) => offer.module);
      expect([...modules].sort()).toEqual([...left].sort());
    }
  });

  it("クリアの局面以外で呼ぶと何も変わらない", () => {
    const game = begin("right");
    expect(openShop(game)).toEqual({ game, events: [] });
  });
});
