import { CONFIG } from "../config";
import { pick } from "./rng";
import type { Cell, Direction, RngState } from "./types";

export const CENTER: Cell = { x: Math.floor(CONFIG.boardSize / 2), y: Math.floor(CONFIG.boardSize / 2) };

export const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

const ALL_CELLS: readonly Cell[] = Array.from({ length: CONFIG.boardSize ** 2 }, (_, i) => ({
  x: i % CONFIG.boardSize,
  y: Math.floor(i / CONFIG.boardSize),
}));

export const insideBoard = (c: Cell) => c.x >= 0 && c.y >= 0 && c.x < CONFIG.boardSize && c.y < CONFIG.boardSize;

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

export function spawnOnFreeCell(rng: RngState, occupied: readonly Cell[]): [Cell, RngState] {
  const blocked = [...occupied, CENTER];
  return pick(rng, ALL_CELLS.filter((c) => !blocked.some((b) => sameCell(b, c))));
}
