import { describe, expect, test } from "vitest";
import { AUDIO } from "../config";
import { bgmVolume, createVolumeStorage, DEFAULT_VOLUMES } from "./volume";

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

describe("createVolumeStorage", () => {
  test("保存した音量を、次に読み込むと取り出せる", () => {
    const storage = memory();
    createVolumeStorage(() => storage).save({ bgm: 0.25, sfx: 0 });
    expect(createVolumeStorage(() => storage).load()).toEqual({ bgm: 0.25, sfx: 0 });
  });

  test("何も保存されていなければ、既定の音量", () => {
    expect(createVolumeStorage(memory).load()).toEqual(DEFAULT_VOLUMES);
    expect(DEFAULT_VOLUMES).toEqual({ bgm: AUDIO.bgmVolume, sfx: AUDIO.sfxVolume });
  });

  test("範囲外や数でない値は、その音量だけ既定にする", () => {
    const storage = memory();
    const volumes = createVolumeStorage(() => storage);
    volumes.save({ bgm: 0.5, sfx: 0.5 });
    for (const [key] of storage.items) storage.items.set(key, JSON.stringify({ bgm: 1.5, sfx: 0.2 }));
    expect(volumes.load()).toEqual({ bgm: DEFAULT_VOLUMES.bgm, sfx: 0.2 });
    for (const [key] of storage.items) storage.items.set(key, JSON.stringify({ bgm: "loud" }));
    expect(volumes.load()).toEqual(DEFAULT_VOLUMES);
    for (const [key] of storage.items) storage.items.set(key, "{");
    expect(volumes.load()).toEqual(DEFAULT_VOLUMES);
  });

  test("取り出せない環境では、既定の音量で、保存しても例外を出さない", () => {
    expect(createVolumeStorage(failing).load()).toEqual(DEFAULT_VOLUMES);
    expect(() => createVolumeStorage(failing).save({ bgm: 0, sfx: 0 })).not.toThrow();
  });
});

describe("bgmVolume", () => {
  test("ふだんは設定どおりで、下げる場面では設定の5割", () => {
    expect(bgmVolume({ bgm: 0.8, sfx: 1 }, "normal")).toBe(0.8);
    expect(bgmVolume({ bgm: 0.8, sfx: 1 }, "ducked")).toBe(0.8 * AUDIO.duckRatio);
    expect(AUDIO.duckRatio).toBe(0.5);
  });
});
