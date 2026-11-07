import { describe, expect, test } from "vite-plus/test";
import { AUDIO } from "../config";
import { bgmVolume } from "./volume";

describe("bgmVolume", () => {
  test("ふだんは設定どおりで、下げる場面では設定の5割", () => {
    expect(bgmVolume({ bgm: 0.8, sfx: 1 }, "normal")).toBe(0.8);
    expect(bgmVolume({ bgm: 0.8, sfx: 1 }, "ducked")).toBe(0.8 * AUDIO.duckRatio);
    expect(AUDIO.duckRatio).toBe(0.5);
  });
});
