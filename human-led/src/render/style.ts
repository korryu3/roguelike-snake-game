export const CELL_PX = 32;
export const boardPx = (boardSize: number) => CELL_PX * boardSize;
export const BLINK_INTERVAL_MS = 100;

export const COLORS = {
  floor: "#0f1a2b",
  gridLine: "#1b2a42",
  center: "#060c16",
  wall: "#46546b",
  wallEdge: "#6b7a92",
  battery: "#4ade80",
  batteryCap: "#bbf7d0",
  doubleBattery: "#c084fc",
  doubleBatteryCap: "#e9d5ff",
  doubleBatteryMark: "#2e1065",
  goal: "#facc15",
  heart: "#f43f5e",
  snakeHead: "#7dd3fc",
  snakeBody: "#0ea5e9",
  stunnedHead: "#fdba74",
  stunnedBody: "#f97316",
} as const;
