import { describe, expect, test } from "vitest";
import { createPreferencesStorage, DEFAULT_PREFERENCES } from "./storage";

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

/** 保存されている中身を、直接書き換える */
const overwrite = (storage: ReturnType<typeof memory>, value: string) => {
  for (const [key] of storage.items) storage.items.set(key, value);
};

describe("createPreferencesStorage", () => {
  test("保存した設定を、次に読み込むと取り出せる", () => {
    const storage = memory();
    const preferences = { lang: "en", volumes: { bgm: 0.25, sfx: 0 } } as const;
    createPreferencesStorage(() => storage).save(preferences);
    expect(createPreferencesStorage(() => storage).load()).toEqual(preferences);
  });

  test("何も保存されていなければ、日本語と既定の音量", () => {
    expect(createPreferencesStorage(memory).load()).toEqual(DEFAULT_PREFERENCES);
    expect(DEFAULT_PREFERENCES.lang).toBe("ja");
  });

  test("使えない値は、その項目だけ既定にする", () => {
    const storage = memory();
    const preferences = createPreferencesStorage(() => storage);
    preferences.save(DEFAULT_PREFERENCES);
    overwrite(storage, JSON.stringify({ lang: "fr", volumes: { bgm: 1.5, sfx: 0.2 } }));
    expect(preferences.load()).toEqual({ lang: "ja", volumes: { bgm: DEFAULT_PREFERENCES.volumes.bgm, sfx: 0.2 } });
    overwrite(storage, JSON.stringify({ lang: "en", volumes: "loud" }));
    expect(preferences.load()).toEqual({ lang: "en", volumes: DEFAULT_PREFERENCES.volumes });
    overwrite(storage, "{");
    expect(preferences.load()).toEqual(DEFAULT_PREFERENCES);
  });

  test("取り出せない環境では、既定の設定で、保存しても例外を出さない", () => {
    expect(createPreferencesStorage(failing).load()).toEqual(DEFAULT_PREFERENCES);
    expect(() => createPreferencesStorage(failing).save(DEFAULT_PREFERENCES)).not.toThrow();
    expect(createPreferencesStorage(() => ({ getItem: failing, setItem: failing })).load()).toEqual(DEFAULT_PREFERENCES);
  });
});
