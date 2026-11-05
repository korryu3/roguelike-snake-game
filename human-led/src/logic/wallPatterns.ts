import { centerOf, insideBoard } from "./board";
import type { Cell } from "./types";

const rect = (x0: number, y0: number, w: number, h: number): Cell[] =>
  Array.from({ length: w * h }, (_, i) => ({ x: x0 + (i % w), y: y0 + Math.floor(i / w) }));

/** 仮のパターン。15×15の盤面で、どれも中央の5×5を空けておく */
export const WALL_PATTERNS: readonly (readonly Cell[])[] = [
  [...rect(2, 2, 3, 1), ...rect(2, 3, 1, 2), ...rect(10, 2, 3, 1), ...rect(12, 3, 1, 2), ...rect(2, 12, 3, 1), ...rect(2, 10, 1, 2), ...rect(10, 12, 3, 1), ...rect(12, 10, 1, 2)],
  [...rect(3, 3, 2, 2), ...rect(10, 3, 2, 2), ...rect(3, 10, 2, 2), ...rect(10, 10, 2, 2)],
  [...rect(4, 3, 7, 1), ...rect(4, 11, 7, 1)],
];

const PATTERN_CENTER = centerOf(15);

/** 盤面の大きさが違っても中央の空きを保つように、パターンを盤面の中央に寄せる */
export function placeWalls(pattern: readonly Cell[], boardSize: number): Cell[] {
  const center = centerOf(boardSize);
  return pattern
    .map((c) => ({ x: c.x - PATTERN_CENTER.x + center.x, y: c.y - PATTERN_CENTER.y + center.y }))
    .filter((c) => insideBoard(c, boardSize));
}
