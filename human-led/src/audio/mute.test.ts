import { describe, expect, test } from "vitest";
import { createMuteStorage } from "./mute";

const memory = () => {
  const items = new Map<string, string>();
  return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => void items.set(key, value) };
};

const failing = () => {
  throw new Error("使えない");
};

describe("createMuteStorage", () => {
  test("保存した消音の状態を、次に読み込むと取り出せる", () => {
    const storage = memory();
    createMuteStorage(() => storage).save(true);
    expect(createMuteStorage(() => storage).load()).toBe(true);
    createMuteStorage(() => storage).save(false);
    expect(createMuteStorage(() => storage).load()).toBe(false);
  });

  test("何も保存されていなければ、消音しない", () => {
    expect(createMuteStorage(memory).load()).toBe(false);
  });

  test("取り出せない環境では、消音せず、保存しても例外を出さない", () => {
    expect(createMuteStorage(failing).load()).toBe(false);
    expect(() => createMuteStorage(failing).save(true)).not.toThrow();
  });
});
