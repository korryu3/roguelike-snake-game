import type { Cell } from "./types";

const rect = (x0: number, y0: number, w: number, h: number): Cell[] =>
  Array.from({ length: w * h }, (_, i) => ({ x: x0 + (i % w), y: y0 + Math.floor(i / w) }));

/** 仮のパターン。どれも中央の5×5を空けておく */
export const WALL_PATTERNS: readonly (readonly Cell[])[] = [
  [...rect(2, 2, 3, 1), ...rect(2, 3, 1, 2), ...rect(10, 2, 3, 1), ...rect(12, 3, 1, 2), ...rect(2, 12, 3, 1), ...rect(2, 10, 1, 2), ...rect(10, 12, 3, 1), ...rect(12, 10, 1, 2)],
  [...rect(3, 3, 2, 2), ...rect(10, 3, 2, 2), ...rect(3, 10, 2, 2), ...rect(10, 10, 2, 2)],
  [...rect(4, 3, 7, 1), ...rect(4, 11, 7, 1)],
];
