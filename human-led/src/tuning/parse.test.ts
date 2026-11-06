import { describe, expect, test } from "vitest";
import { DEFAULT_TUNING } from "../config";
import { parseTuningJson } from "./parse";

const parsed = (value: unknown) => {
  const result = parseTuningJson(JSON.stringify(value));
  if (!result.ok) throw new Error(`読めるはず: ${result.reason}`);
  return { ...result, issues: [...result.issues].sort((a, b) => a.path.localeCompare(b.path)) };
};

describe("parseTuningJson", () => {
  test("既定値を書き出したJSONを読むと、既定値と同じになる", () => {
    expect(parsed(DEFAULT_TUNING)).toEqual({ ok: true, tuning: DEFAULT_TUNING, issues: [] });
  });

  test("項目の順番が違っても、読み込んだものを書き出すと既定値を書き出したものと同じ文字列になる", () => {
    const reversed = { modules: DEFAULT_TUNING.modules, config: Object.fromEntries(Object.entries(DEFAULT_TUNING.config).reverse()) };
    expect(JSON.stringify(parsed(reversed).tuning)).toBe(JSON.stringify(DEFAULT_TUNING));
  });

  test("書かれていない項目は既定値になり、問題にしない", () => {
    const result = parsed({ config: { moveIntervalMs: 90 }, modules: { revive: { price: 1 } } });
    expect(result.tuning.config).toEqual({ ...DEFAULT_TUNING.config, moveIntervalMs: 90 });
    expect(result.tuning.modules).toEqual({ ...DEFAULT_TUNING.modules, revive: { ...DEFAULT_TUNING.modules.revive, price: 1 } });
    expect(parsed({}).tuning).toEqual(DEFAULT_TUNING);
    expect(result.issues).toEqual([]);
  });

  test("数でない値は既定値に戻し、問題として返す", () => {
    const result = parsed({ config: { moveIntervalMs: "90", stunMs: null }, modules: { revive: { price: true } } });
    expect(result.tuning).toEqual(DEFAULT_TUNING);
    expect(result.issues).toEqual([
      { path: "config.moveIntervalMs", kind: "invalid" },
      { path: "config.stunMs", kind: "invalid" },
      { path: "modules.revive.price", kind: "invalid" },
    ]);
  });

  test("負の値・範囲外の値は既定値に戻し、問題として返す", () => {
    const result = parsed({ config: { stunMs: -1, boardSize: 1000 }, modules: { revive: { maxStack: -2 } } });
    expect(result.tuning).toEqual(DEFAULT_TUNING);
    expect(result.issues).toEqual([
      { path: "config.boardSize", kind: "invalid" },
      { path: "config.stunMs", kind: "invalid" },
      { path: "modules.revive.maxStack", kind: "invalid" },
    ]);
  });

  test("整数の項目に小数を入れたら既定値に戻し、問題として返す", () => {
    const result = parsed({ config: { initialHp: 2.5 } });
    expect(result.tuning).toEqual(DEFAULT_TUNING);
    expect(result.issues).toEqual([{ path: "config.initialHp", kind: "invalid" }]);
  });

  test("確率の項目は0以上1以下の小数を受け付ける", () => {
    const ok = parsed({ config: { heartWithBatteryChance: 0.5, doublePpBatteryChancePerStack: 1 } });
    expect(ok.tuning.config).toMatchObject({ heartWithBatteryChance: 0.5, doublePpBatteryChancePerStack: 1 });
    expect(ok.issues).toEqual([]);
    expect(parsed({ config: { heartWithBatteryChance: 1.5 } }).issues).toEqual([
      { path: "config.heartWithBatteryChance", kind: "invalid" },
    ]);
  });

  test("知らない項目は捨て、問題として返す", () => {
    const result = parsed({ speed: 1, config: { moveIntervalMS: 90 }, modules: { teleport: { price: 1 }, revive: { color: "red" } } });
    expect(result.tuning).toEqual(DEFAULT_TUNING);
    expect(result.issues).toEqual([
      { path: "config.moveIntervalMS", kind: "unknown" },
      { path: "modules.revive.color", kind: "unknown" },
      { path: "modules.teleport", kind: "unknown" },
      { path: "speed", kind: "unknown" },
    ]);
  });

  test("configやモジュールがオブジェクトでなければ、その中を既定値にし、問題として返す", () => {
    const result = parsed({ config: [1, 2], modules: { revive: 3 } });
    expect(result.tuning).toEqual(DEFAULT_TUNING);
    expect(result.issues).toEqual([
      { path: "config", kind: "invalid" },
      { path: "modules.revive", kind: "invalid" },
    ]);
  });

  test("JSONとして読めない文字列は、読み込みの失敗として返す", () => {
    expect(parseTuningJson("{config:")).toEqual({ ok: false, reason: "notJson" });
  });

  test("一番外がオブジェクトでなければ、読み込みの失敗として返す", () => {
    for (const text of ["null", "[]", "3", '"x"']) expect(parseTuningJson(text)).toEqual({ ok: false, reason: "notObject" });
  });

  test("壁のパターンが書かれていなければ、既定のパターンになり、問題にしない", () => {
    const result = parsed({ config: {} });
    expect(result.tuning.wallPatterns).toEqual(DEFAULT_TUNING.wallPatterns);
    expect(result.issues).toEqual([]);
  });

  test("書かれた壁のパターンを読み込む", () => {
    const patterns = [["#...#"], ["....."]];
    const result = parsed({ wallPatterns: patterns });
    expect(result.tuning.wallPatterns).toEqual(patterns);
    expect(result.issues).toEqual([]);
  });

  test("検査を通らない壁のパターンは捨て、問題として返す", () => {
    const result = parsed({ wallPatterns: [["#...#"], ["..#.."], ["#..x#"], [1, 2], "....."] });
    expect(result.tuning.wallPatterns).toEqual([["#...#"]]);
    expect(result.issues).toEqual([
      { path: "wallPatterns.1", kind: "invalid" },
      { path: "wallPatterns.2", kind: "invalid" },
      { path: "wallPatterns.3", kind: "invalid" },
      { path: "wallPatterns.4", kind: "invalid" },
    ]);
  });

  test("壁のパターンが配列でなければ、既定のパターンにし、問題として返す", () => {
    const result = parsed({ wallPatterns: "#...#" });
    expect(result.tuning.wallPatterns).toEqual(DEFAULT_TUNING.wallPatterns);
    expect(result.issues).toEqual([{ path: "wallPatterns", kind: "invalid" }]);
  });

  test("使える壁のパターンが1つも残らなければ、既定のパターンにし、問題として返す", () => {
    expect(parsed({ wallPatterns: [] }).issues).toEqual([{ path: "wallPatterns", kind: "invalid" }]);
    const result = parsed({ wallPatterns: [["..#.."]] });
    expect(result.tuning.wallPatterns).toEqual(DEFAULT_TUNING.wallPatterns);
    expect(result.issues).toEqual([
      { path: "wallPatterns", kind: "invalid" },
      { path: "wallPatterns.0", kind: "invalid" },
    ]);
  });
});
