import { pick } from "./rng";
import type { Cell, Direction, RngState } from "./types";

export const centerOf = (boardSize: number): Cell => ({ x: Math.floor(boardSize / 2), y: Math.floor(boardSize / 2) });

export const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

export const insideBoard = (c: Cell, boardSize: number) => c.x >= 0 && c.y >= 0 && c.x < boardSize && c.y < boardSize;

const DELTA: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const neighbor = (cell: Cell, direction: Direction): Cell => ({
  x: cell.x + DELTA[direction].x,
  y: cell.y + DELTA[direction].y,
});

export const OPPOSITE: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };

export const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

const allCells = (boardSize: number): Cell[] =>
  Array.from({ length: boardSize ** 2 }, (_, i) => ({ x: i % boardSize, y: Math.floor(i / boardSize) }));

/**
 * ものを置けるマス。壁、ほかのもの、体、中央のどれとも重ならない空きマスから選ぶ。
 * 空きマスがなければ、頭を除く体のマスに置く。ものを取るのは頭だけなので、体の上に置いても取られない
 */
export function placeableCells(blocked: readonly Cell[], body: readonly Cell[], boardSize: number): Cell[] {
  const taken = (c: Cell) => blocked.some((b) => sameCell(b, c));
  const center = centerOf(boardSize);
  const free = allCells(boardSize).filter(
    (c) => !taken(c) && !body.some((b) => sameCell(b, c)) && !sameCell(c, center),
  );
  return free.length > 0 ? free : body.slice(1).filter((c) => !taken(c));
}

/** blockedは、体を除く、ものを置けないマス（壁と、ほかのもの） */
export function spawnCell(
  rng: RngState,
  blocked: readonly Cell[],
  body: readonly Cell[],
  boardSize: number,
): [Cell, RngState] {
  return pick(rng, placeableCells(blocked, body, boardSize));
}
