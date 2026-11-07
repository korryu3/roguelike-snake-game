import { describe, expect, test } from "vite-plus/test";
import { patternFromText, patternToText } from "./patternText";

describe("patternFromText", () => {
  test("入力欄の文字を行に分け、行の前後の空白と空行を捨てる", () => {
    expect(patternFromText("\n  #..# \r\n\n....\n  ")).toEqual(["#..#", "...."]);
  });
});

describe("patternToText", () => {
  test("パターンを改行でつないだ文字にする", () => {
    expect(patternToText(["#..#", "...."])).toBe("#..#\n....");
  });
});
