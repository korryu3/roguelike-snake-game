import { describe, expect, test } from "vite-plus/test";
import { CONFIG } from "../config";
import { MESSAGES } from "./messages";

const { ja, en } = MESSAGES;

describe("MESSAGES", () => {
  test("タイトルは、日本語がログスネ、英語がRLSG", () => {
    expect([ja.title, en.title]).toEqual(["ログスネ", "RLSG"]);
  });

  test("数を含む文言は、言語ごとの言い方で数を埋める", () => {
    expect([ja.hud.stage(3), ja.shop.price(12), ja.shop.reroll(2), ja.cleared.title(4)]).toEqual([
      "ステージ 3",
      "12 PP",
      "リロール（2 PP）",
      "ステージ 4 クリア",
    ]);
    expect([en.hud.stage(3), en.shop.price(12), en.shop.reroll(2), en.cleared.title(4)]).toEqual([
      "Stage 3",
      "12 PP",
      "Reroll (2 PP)",
      "Stage 4 Cleared",
    ]);
  });

  test("制限時間を延ばすモジュールの説明は、調整した延長秒数を使う", () => {
    const config = { ...CONFIG, timeLimitPlusMs: 7_000, timeLimitBoostMs: 25_000 };
    for (const t of [ja, en]) {
      expect(t.modules.timeLimitPlus5s.description(config)).toContain("7");
      expect(t.modules.timeLimitBoostNextStage.description(config)).toContain("25");
    }
  });

  test("PP2倍のバッテリーの説明は、調整した確率を%で使う", () => {
    const config = { ...CONFIG, doublePpBatteryChancePerStack: 0.25 };
    for (const t of [ja, en]) expect(t.modules.doublePpBattery.description(config)).toContain("25%");
  });
});
