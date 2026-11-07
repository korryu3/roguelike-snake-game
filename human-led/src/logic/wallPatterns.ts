import { centerOf, insideBoard } from "./board";
import type { Cell, WallPattern, WallPatternIssue } from "./types";

/** 使えるパターンならnull、使えなければその理由を返す */
export function checkWallPattern(pattern: WallPattern): WallPatternIssue | null {
  // 行が1つもないときも、everyはtrueになる
  if (pattern.every((row) => row.length === 0)) return "empty";
  if (pattern.some((row) => /[^#.]/.test(row))) return "badChar";
  if (pattern.some((row) => row.length !== pattern[0]!.length)) return "notRectangular";
  const cx = Math.floor(pattern[0]!.length / 2);
  const cy = Math.floor(pattern.length / 2);
  const blocked = pattern.some((row, y) =>
    [...row].some((ch, x) => ch === "#" && Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1),
  );
  return blocked ? "blocksCenter" : null;
}

/** パターンの中央を盤面の中央に合わせて置き、盤面からはみ出した壁は捨てる */
export function placeWallPattern(pattern: WallPattern, boardSize: number): Cell[] {
  const center = centerOf(boardSize);
  const dx = center.x - Math.floor((pattern[0]?.length ?? 0) / 2);
  const dy = center.y - Math.floor(pattern.length / 2);
  return pattern
    .flatMap((row, y) => [...row].flatMap((ch, x) => (ch === "#" ? [{ x: x + dx, y: y + dy }] : [])))
    .filter((c) => insideBoard(c, boardSize));
}
