import { describe, expect, test } from "vitest";
import { DEFAULT_TUNING, type Tuning } from "../config";
import { MESSAGES } from "../i18n/messages";
import { startRun } from "../logic/game";
import { openShop } from "../logic/shop";
import { cleared } from "../logic/testing";
import type { Game, ModuleId, Offer } from "../logic/types";
import { describeModules, describeOffers, reviveOptions } from "./view";

const { en } = MESSAGES;

function shop(pp: number, offers: readonly Offer[], tuning: Tuning = DEFAULT_TUNING): Extract<Game, { phase: "shop" }> {
  const game = openShop(cleared({ pp, tuning })).game;
  if (game.phase !== "shop") throw new Error(game.phase);
  return { ...game, run: { ...game.run, pp }, offers };
}

describe("describeOffers", () => {
  const offers: Offer[] = [
    { module: "revive", sold: false },
    { module: "maxHpPlus1", sold: true },
    { module: "timeLimitPlus5s", sold: false },
  ];

  test("候補ごとに、名前、説明、値段、購入済みかどうかを、候補の並びの順で返す", () => {
    const tuning: Tuning = { ...DEFAULT_TUNING, config: { ...DEFAULT_TUNING.config, timeLimitPlusMs: 7_000 } };
    expect(describeOffers(shop(0, offers, tuning), en)).toMatchObject([
      { offerIndex: 0, module: "revive", name: "Revive", price: 12, sold: false },
      { offerIndex: 1, module: "maxHpPlus1", name: "Max HP +1", price: 7, sold: true },
      { offerIndex: 2, module: "timeLimitPlus5s", name: "Time Limit +5s", description: expect.stringContaining("7s"), price: 4, sold: false },
    ]);
  });

  test("PPが値段以上で未購入なら買える", () => {
    expect(describeOffers(shop(12, offers), en).map((o) => o.affordable)).toEqual([true, false, true]);
  });

  test("PPが値段未満なら買えない", () => {
    expect(describeOffers(shop(11, offers), en).map((o) => o.affordable)).toEqual([false, false, true]);
  });

  test("値段は調整した数値から引く", () => {
    const tuning: Tuning = { ...DEFAULT_TUNING, modules: { ...DEFAULT_TUNING.modules, revive: { price: 3, maxStack: 2 } } };
    expect(describeOffers(shop(3, offers, tuning), en)[0]).toMatchObject({ price: 3, affordable: true });
  });
});

describe("describeModules", () => {
  test("同じモジュールは1行にまとめ、数を数える。並びは最初に出てきた順", () => {
    expect(describeModules(["maxHpPlus1", "revive", "maxHpPlus1", "wallDamageImmunity", "revive", "maxHpPlus1"], en)).toEqual([
      { module: "maxHpPlus1", name: "Max HP +1", count: 3 },
      { module: "revive", name: "Revive", count: 2 },
      { module: "wallDamageImmunity", name: "Wall Damage Immunity", count: 1 },
    ]);
  });

  test("1つもなければ空", () => {
    expect(describeModules([], en)).toEqual([]);
  });
});

describe("reviveOptions", () => {
  const runWith = (modules: readonly ModuleId[]) => startRun(1, { modules }).run;

  test("持っている生き返るモジュールを種類ごとに並べ、数と、生き返ったときのHPと上限を返す", () => {
    const run = runWith(["reviveAtOneHp", "maxHpPlus1", "revive", "reviveAtOneHp"]);
    expect(reviveOptions(run, en)).toEqual([
      { module: "reviveAtOneHp", name: "Revive (Drawback)", count: 2, hp: 1, maxHp: 4 },
      { module: "revive", name: "Revive", count: 1, hp: 4, maxHp: 4 },
    ]);
  });

  test("生き返らないモジュールは並べない", () => {
    expect(reviveOptions(runWith(["maxHpPlus1", "wallDamageImmunity"]), en)).toEqual([]);
  });
});
