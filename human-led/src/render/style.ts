import { keysOf, recordOf } from "../lib/records";
export const CELL_PX = 32;
export const boardPx = (boardSize: number) => CELL_PX * boardSize;
export const BLINK_INTERVAL_MS = 100;

/** 盤面の色と、テーマ（index.css）でのCSS変数の名前 */
const CSS_VARIABLES = {
  floor: "--color-board-floor",
  gridLine: "--color-board-grid",
  center: "--color-board-center",
  wall: "--color-wall",
  wallEdge: "--color-wall-edge",
  battery: "--color-battery",
  batteryCap: "--color-battery-cap",
  doubleBattery: "--color-double-battery",
  doubleBatteryCap: "--color-double-battery-cap",
  doubleBatteryMark: "--color-double-battery-mark",
  goal: "--color-goal",
  heart: "--color-heart",
  snakeHead: "--color-snake-head",
  snakeBody: "--color-snake-body",
  stunnedHead: "--color-stunned-head",
  stunnedBody: "--color-stunned-body",
} as const;

export type BoardColors = Readonly<Record<keyof typeof CSS_VARIABLES, string>>;

export const BOARD_COLOR_KEYS: readonly (keyof BoardColors)[] = keysOf(CSS_VARIABLES);

/** 色はテーマに1か所だけ書き、ここではCSS変数の名前から読む */
export function readBoardColors(readCssVariable: (name: string) => string): BoardColors {
  return recordOf(BOARD_COLOR_KEYS, (key) => readCssVariable(CSS_VARIABLES[key]).trim());
}
