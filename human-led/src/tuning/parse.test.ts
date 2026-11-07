import { describe, expect, test } from "vite-plus/test";
import { DEFAULT_TUNING } from "../config";
import { parseTuningJson } from "./parse";

const parse = (value: unknown) => parseTuningJson(JSON.stringify(value));

const loaded = (value: unknown) => {
  const result = parse(value);
  if (!result.ok) throw new Error(`読めるはず: ${JSON.stringify(result)}`);
  return result.tuning;
};

/** 読み込めないはずのJSONの、問題の一覧（位置の順） */
const issuesOf = (value: unknown) => {
  const result = parse(value);
  if (result.ok || result.reason !== "invalid") throw new Error(`使えない値で失敗するはず: ${JSON.stringify(result)}`);
  return result.issues.toSorted((a, b) => a.path.localeCompare(b.path));
};

describe("parseTuningJson", () => {
  test("既定値を書き出したJSONを読むと、既定値と同じになる", () => {
    expect(parse(DEFAULT_TUNING)).toEqual({ ok: true, tuning: DEFAULT_TUNING });
  });

  test("項目の順番が違っても、読み込んだものを書き出すと既定値を書き出したものと同じ文字列になる", () => {
    const reversed = {
      modules: DEFAULT_TUNING.modules,
      config: Object.fromEntries(Object.entries(DEFAULT_TUNING.config).toReversed()),
    };
    expect(JSON.stringify(loaded(reversed))).toBe(JSON.stringify(DEFAULT_TUNING));
  });

  test("書かれていない項目は既定値で埋める", () => {
    const tuning = loaded({ config: { moveIntervalMs: 90 }, modules: { revive: { price: 1 } } });
    expect(tuning.config).toEqual({ ...DEFAULT_TUNING.config, moveIntervalMs: 90 });
    expect(tuning.modules).toEqual({
      ...DEFAULT_TUNING.modules,
      revive: { ...DEFAULT_TUNING.modules.revive, price: 1 },
    });
    expect(loaded({})).toEqual(DEFAULT_TUNING);
  });

  test("数でない値があれば読み込まず、その項目を使えない値として返す", () => {
    expect(issuesOf({ config: { moveIntervalMs: "90", stunMs: null }, modules: { revive: { price: true } } })).toEqual([
      { path: "config.moveIntervalMs", kind: "invalid" },
      { path: "config.stunMs", kind: "invalid" },
      { path: "modules.revive.price", kind: "invalid" },
    ]);
  });

  test("範囲外の値があれば読み込まず、その項目を使えない値として返す", () => {
    expect(issuesOf({ config: { stunMs: -1, boardSize: 1000 }, modules: { revive: { maxStack: -2 } } })).toEqual([
      { path: "config.boardSize", kind: "invalid" },
      { path: "config.stunMs", kind: "invalid" },
      { path: "modules.revive.maxStack", kind: "invalid" },
    ]);
  });

  test("整数の項目に小数があれば読み込まず、その項目を使えない値として返す", () => {
    expect(issuesOf({ config: { initialHp: 2.5 } })).toEqual([{ path: "config.initialHp", kind: "invalid" }]);
  });

  test("確率の項目は0以上1以下の小数を受け付け、1を超えれば使えない値", () => {
    expect(loaded({ config: { heartWithBatteryChance: 0.5, doublePpBatteryChancePerStack: 1 } }).config).toMatchObject({
      heartWithBatteryChance: 0.5,
      doublePpBatteryChancePerStack: 1,
    });
    expect(issuesOf({ config: { heartWithBatteryChance: 1.5 } })).toEqual([
      { path: "config.heartWithBatteryChance", kind: "invalid" },
    ]);
  });

  test("知らない項目があれば読み込まず、知らない項目として返す", () => {
    expect(
      issuesOf({
        speed: 1,
        config: { moveIntervalMS: 90 },
        modules: { teleport: { price: 1 }, revive: { color: "red" } },
      }),
    ).toEqual([
      { path: "config.moveIntervalMS", kind: "unknown" },
      { path: "modules.revive.color", kind: "unknown" },
      { path: "modules.teleport", kind: "unknown" },
      { path: "speed", kind: "unknown" },
    ]);
  });

  test("configやモジュールがオブジェクトでなければ読み込まず、使えない値として返す", () => {
    expect(issuesOf({ config: [1, 2], modules: { revive: 3 } })).toEqual([
      { path: "config", kind: "invalid" },
      { path: "modules.revive", kind: "invalid" },
    ]);
  });

  test("JSONとして読めない文字列は、notJsonとして返す", () => {
    expect(parseTuningJson("{config:")).toEqual({ ok: false, reason: "notJson" });
  });

  test("一番外がオブジェクトでなければ読み込まず、一番外を使えない値として返す", () => {
    for (const value of [null, [], 3, "x"]) expect(issuesOf(value)).toEqual([{ path: "", kind: "invalid" }]);
  });

  test("壁のパターンが書かれていなければ、既定のパターンになる", () => {
    expect(loaded({ config: {} }).wallPatterns).toEqual(DEFAULT_TUNING.wallPatterns);
  });

  test("書かれた壁のパターンを読み込む", () => {
    const patterns = [["#...#"], ["....."]];
    expect(loaded({ wallPatterns: patterns }).wallPatterns).toEqual(patterns);
  });

  test("検査を通らない壁のパターンがあれば読み込まず、何番目かを使えない値として返す", () => {
    expect(issuesOf({ wallPatterns: [["#...#"], ["..#.."], ["#..x#"], [1, 2], "....."] })).toEqual([
      { path: "wallPatterns.1", kind: "invalid" },
      { path: "wallPatterns.2", kind: "invalid" },
      { path: "wallPatterns.3", kind: "invalid" },
      { path: "wallPatterns.4", kind: "invalid" },
    ]);
  });

  test("壁のパターンが配列でなければ読み込まず、使えない値として返す", () => {
    expect(issuesOf({ wallPatterns: "#...#" })).toEqual([{ path: "wallPatterns", kind: "invalid" }]);
  });

  test("壁のパターンが空の配列なら読み込まず、使えない値として返す", () => {
    expect(issuesOf({ wallPatterns: [] })).toEqual([{ path: "wallPatterns", kind: "invalid" }]);
  });
});
