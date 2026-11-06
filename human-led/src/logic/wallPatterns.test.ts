import { describe, expect, it } from "vitest";
import { checkWallPattern, placeWallPattern } from "./wallPatterns";

const FIVE = [
  "#...#",
  ".....",
  ".....",
  ".....",
  "#...#",
];

describe("checkWallPattern", () => {
  it("#と.だけで、行の長さがそろい、中央の3×3が床なら問題なし", () => {
    expect(checkWallPattern(FIVE)).toBeNull();
  });

  it("#と.以外の文字があれば、使えない文字として返す", () => {
    expect(checkWallPattern(["#...x", ".....", ".....", ".....", "....."])).toBe("badChar");
  });

  it("行の長さがそろっていなければ、そろっていないとして返す", () => {
    expect(checkWallPattern(["#....", "....", ".....", ".....", "....."])).toBe("notRectangular");
  });

  it("行がなければ、空として返す", () => {
    expect(checkWallPattern([])).toBe("empty");
    expect(checkWallPattern(["", ""])).toBe("empty");
  });

  it("中央のマスかそのまわりに壁があれば、中央をふさいでいるとして返す", () => {
    expect(checkWallPattern([".....", ".....", "..#..", ".....", "....."])).toBe("blocksCenter");
    expect(checkWallPattern([".....", ".#...", ".....", ".....", "....."])).toBe("blocksCenter");
    expect(checkWallPattern([".....", ".....", ".....", "...#.", "....."])).toBe("blocksCenter");
  });

  it("3×3より小さいパターンでも、壁がなければ問題なし", () => {
    expect(checkWallPattern(["."])).toBeNull();
  });
});

describe("placeWallPattern", () => {
  it("盤面と同じ大きさなら、#の位置がそのまま壁になる", () => {
    expect(placeWallPattern(FIVE, 5)).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 4 },
      { x: 4, y: 4 },
    ]);
  });

  it("盤面より小さいパターンは、中央を盤面の中央に合わせて置く", () => {
    expect(placeWallPattern(FIVE, 9)).toEqual([
      { x: 2, y: 2 },
      { x: 6, y: 2 },
      { x: 2, y: 6 },
      { x: 6, y: 6 },
    ]);
  });

  it("盤面より大きいパターンは、はみ出した壁を捨てる", () => {
    const pattern = [
      "#.....#",
      ".#.....",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
    ];
    expect(placeWallPattern(pattern, 5)).toEqual([{ x: 0, y: 0 }]);
  });
});
