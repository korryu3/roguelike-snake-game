import { describe, expect, test } from "vite-plus/test";
import { DEFAULT_TUNING, type Tuning } from "../config";
import { createTuningStorage } from "./storage";

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    items,
  };
};

const failing = () => {
  throw new Error("使えない");
};

const changed: Tuning = { ...DEFAULT_TUNING, config: { ...DEFAULT_TUNING.config, moveIntervalMs: 90 } };

describe("createTuningStorage", () => {
  test("保存した数値を、次に読み込むと取り出せる", () => {
    const storage = memory();
    expect(createTuningStorage(() => storage).save(changed)).toBe(true);
    expect(createTuningStorage(() => storage).load()).toEqual(changed);
  });

  test("何も保存されていなければ既定値", () => {
    expect(createTuningStorage(memory).load()).toEqual(DEFAULT_TUNING);
  });

  test("保存されたものが壊れていたら既定値", () => {
    const storage = memory();
    const tuning = createTuningStorage(() => storage);
    tuning.save(changed);
    for (const [key] of storage.items) storage.items.set(key, "{broken");
    expect(tuning.load()).toEqual(DEFAULT_TUNING);
  });

  test("読み込みで例外が出たら既定値", () => {
    expect(createTuningStorage(failing).load()).toEqual(DEFAULT_TUNING);
    expect(createTuningStorage(() => ({ getItem: failing, setItem: failing })).load()).toEqual(DEFAULT_TUNING);
  });

  test("保存で例外が出たら、失敗を返し、例外を外に出さない", () => {
    expect(createTuningStorage(failing).save(changed)).toBe(false);
    expect(createTuningStorage(() => ({ getItem: () => null, setItem: failing })).save(changed)).toBe(false);
  });
});
