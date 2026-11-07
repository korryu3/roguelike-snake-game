import { describe, expect, it } from "vite-plus/test";
import { CONFIG, MODULES } from "../config";
import { buyModule, openShop, reroll } from "./shop";
import { begin, cleared, offersOf } from "./testing";
import type { Game, ModuleId, RunSetup, StepResult } from "./types";

const ALL_MODULES = Object.keys(MODULES) as ModuleId[];
const seeds = Array.from({ length: 30 }, (_, i) => i + 1);

/** onlyの3つ以外を上限まで持たせて、候補をその3つにする */
const maxedExcept = (only: readonly ModuleId[]): ModuleId[] =>
  ALL_MODULES.filter((id) => !only.includes(id)).flatMap((id) => Array<ModuleId>(MODULES[id].maxStack).fill(id));

const shopWith = (setup: RunSetup = {}, seed = 1) => openShop(cleared({ pp: 100, ...setup }, seed)).game;

const offerAt = (game: Game, index: number) => {
  const offer = offersOf(game)[index];
  if (offer === undefined) throw new Error(`候補がない: ${index}`);
  return offer;
};

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
    for (const seed of seeds) {
      const modules = offersOf(openShop(cleared({ modules: maxedExcept(left) }, seed)).game).map(
        (offer) => offer.module,
      );
      expect(modules.toSorted()).toEqual(left.toSorted());
    }
  });

  it("クリアの局面以外で呼ぶと何も変わらない", () => {
    const game = begin("right");
    expect(openShop(game)).toEqual({ game, events: [] });
  });
});

describe("buyModule", () => {
  it("買うとPPが値段ぶん減り、持っているモジュールと買った記録に加わり、その候補は購入済みになる", () => {
    const shop = shopWith();
    const { module } = offerAt(shop, 0);
    const { game } = buyModule(shop, 0);
    expect(game.run.pp).toBe(100 - MODULES[module].price);
    expect(game.run.modules).toEqual([module]);
    expect(game.run.purchased).toEqual([module]);
    expect(offerAt(game, 0).sold).toBe(true);
    expect(offersOf(game).slice(1)).toEqual(offersOf(shop).slice(1));
  });

  it("PPが足りなければ何も変わらない", () => {
    const shop = shopWith({ pp: 0 });
    expect(buyModule(shop, 0)).toEqual({ game: shop, events: [] });
  });

  it("購入済みの候補は買えない", () => {
    const bought = buyModule(shopWith(), 0).game;
    expect(buyModule(bought, 0)).toEqual({ game: bought, events: [] });
  });

  it("3つすべて買い切ると、無料で3つの新しい未購入の候補になる", () => {
    const shop = shopWith();
    const total = offersOf(shop).reduce((sum, offer) => sum + MODULES[offer.module].price, 0);
    const { game } = [0, 1, 2].reduce<StepResult>((acc, i) => buyModule(acc.game, i), { game: shop, events: [] });
    expect(game.run.pp).toBe(100 - total);
    expect(offersOf(game)).toHaveLength(CONFIG.shopOfferCount);
    expect(offersOf(game).every((offer) => !offer.sold)).toBe(true);
  });

  it("HPの上限+1を買うと、現在のHPも1増える", () => {
    const shop = shopWith({ modules: maxedExcept(["maxHpPlus1", "revive", "timeLimitBoostNextStage"]) });
    const index = offersOf(shop).findIndex((offer) => offer.module === "maxHpPlus1");
    expect(buyModule(shop, index).game.run.hp).toBe(shop.run.hp + 1);
  });

  it("モジュールの画面以外で呼ぶと何も変わらない", () => {
    const game = cleared({ pp: 100 });
    expect(buyModule(game, 0)).toEqual({ game, events: [] });
  });
});

describe("reroll", () => {
  it("PPをリロールの値段ぶん払い、3つとも未購入の候補が引き直される", () => {
    const bought = buyModule(shopWith(), 0).game;
    const { game } = reroll(bought);
    expect(game.run.pp).toBe(bought.run.pp - CONFIG.rerollPrice);
    expect(offersOf(game)).toHaveLength(CONFIG.shopOfferCount);
    expect(offersOf(game).every((offer) => !offer.sold)).toBe(true);
  });

  it("引き直すと、候補のモジュールが変わる", () => {
    const modulesOf = (game: Game) => offersOf(game).map((offer) => offer.module);
    const changed = seeds.filter((seed) => {
      const shop = shopWith({}, seed);
      return JSON.stringify(modulesOf(reroll(shop).game)) !== JSON.stringify(modulesOf(shop));
    });
    expect(changed.length).toBeGreaterThan(seeds.length / 2);
  });

  it("PPが足りなければ何も変わらない", () => {
    const shop = shopWith({ pp: CONFIG.rerollPrice - 1 });
    expect(reroll(shop)).toEqual({ game: shop, events: [] });
  });

  it("モジュールの画面以外で呼ぶと何も変わらない", () => {
    const game = cleared({ pp: 100 });
    expect(reroll(game)).toEqual({ game, events: [] });
  });
});
