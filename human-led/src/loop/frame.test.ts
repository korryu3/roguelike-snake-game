import { describe, expect, test } from "vite-plus/test";
import { frameElapsedMs, MAX_FRAME_MS } from "./frame";

describe("frameElapsedMs", () => {
  test("最初のフレームは0ミリ秒", () => {
    expect(frameElapsedMs(null, 1_000)).toBe(0);
  });

  test("前のフレームとの差を返す", () => {
    expect(frameElapsedMs(1_000, 1_016)).toBe(16);
  });

  test("差が上限を超えたら上限で止める", () => {
    expect(frameElapsedMs(1_000, 1_000 + MAX_FRAME_MS + 5_000)).toBe(MAX_FRAME_MS);
  });

  test("時刻が戻ったら0ミリ秒", () => {
    expect(frameElapsedMs(1_000, 900)).toBe(0);
  });
});
