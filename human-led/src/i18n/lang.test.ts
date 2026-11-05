import { describe, expect, test } from "vitest";
import { createLangStorage } from "./lang";

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

describe("createLangStorage", () => {
  test("保存した言語を、次に読み込むと取り出せる", () => {
    const storage = memory();
    createLangStorage(() => storage).save("en");
    expect(createLangStorage(() => storage).load()).toBe("en");
  });

  test("何も保存されていなければ日本語", () => {
    expect(createLangStorage(memory).load()).toBe("ja");
  });

  test("知らない値が保存されていたら日本語", () => {
    const storage = memory();
    const lang = createLangStorage(() => storage);
    lang.save("en");
    for (const [key] of storage.items) storage.items.set(key, "fr");
    expect(lang.load()).toBe("ja");
  });

  test("読み込みで例外が出たら日本語", () => {
    expect(createLangStorage(failing).load()).toBe("ja");
    expect(createLangStorage(() => ({ getItem: failing, setItem: failing })).load()).toBe("ja");
  });

  test("保存で例外が出ても、例外を外に出さない", () => {
    expect(() => createLangStorage(failing).save("en")).not.toThrow();
    expect(() => createLangStorage(() => ({ getItem: () => null, setItem: failing })).save("en")).not.toThrow();
  });
});
