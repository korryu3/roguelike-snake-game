import { describe, expect, test } from "vite-plus/test";
import { formatRemainingTime } from "./format";

describe("formatRemainingTime", () => {
  test("残りミリ秒を、切り上げた分:秒で表す", () => {
    expect([120_000, 65_001, 9_000, 1].map(formatRemainingTime)).toEqual(["2:00", "1:06", "0:09", "0:01"]);
  });

  test("0未満は0:00", () => {
    expect(formatRemainingTime(-1_500)).toBe("0:00");
  });
});
