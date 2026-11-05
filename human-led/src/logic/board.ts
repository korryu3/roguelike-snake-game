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

const freeCells = (occupied: readonly Cell[], boardSize: number) => {
  const blocked = [...occupied, centerOf(boardSize)];
  return Array.from({ length: boardSize ** 2 }, (_, i) => ({ x: i % boardSize, y: Math.floor(i / boardSize) })).filter(
    (c) => !blocked.some((b) => sameCell(b, c)),
  );
};

export const hasFreeCell = (occupied: readonly Cell[], boardSize: number) => freeCells(occupied, boardSize).length > 0;

export function spawnOnFreeCell(rng: RngState, occupied: readonly Cell[], boardSize: number): [Cell, RngState] {
  return pick(rng, freeCells(occupied, boardSize));
}
