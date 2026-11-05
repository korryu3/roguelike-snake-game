import { centerOf } from "../logic/board";
import type { BatteryKind, Cell, Game, Movement, StageState } from "../logic/types";
import { BLINK_INTERVAL_MS, boardPx, CELL_PX, COLORS } from "./style";

type Ctx = CanvasRenderingContext2D;

const px = (cell: Cell) => ({ x: cell.x * CELL_PX, y: cell.y * CELL_PX });

export function drawGame(ctx: Ctx, game: Game): void {
  if (!("stage" in game)) return;
  const { stage } = game;
  const { boardSize } = game.run.tuning.config;
  drawGrid(ctx, boardPx(boardSize));
  drawCenter(ctx, centerOf(boardSize));
  drawWalls(ctx, stage.walls);
  drawBattery(ctx, stage.battery, stage.batteryKind);
  if (stage.goal) drawGoal(ctx, stage.goal);
  drawHearts(ctx, stage.hearts);
  drawSnake(ctx, stage.body, "movement" in game ? game.movement : null);
}

function drawGrid(ctx: Ctx, size: number): void {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= size; i += CELL_PX) {
    ctx.moveTo(i + 0.5, 0);
    ctx.lineTo(i + 0.5, size);
    ctx.moveTo(0, i + 0.5);
    ctx.lineTo(size, i + 0.5);
  }
  ctx.stroke();
}

function drawCenter(ctx: Ctx, center: Cell): void {
  const { x, y } = px(center);
  ctx.fillStyle = COLORS.center;
  ctx.fillRect(x + 1, y + 1, CELL_PX - 1, CELL_PX - 1);
}

function drawWalls(ctx: Ctx, walls: readonly Cell[]): void {
  for (const wall of walls) {
    const { x, y } = px(wall);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(x + 1, y + 1, CELL_PX - 1, CELL_PX - 1);
    ctx.fillStyle = COLORS.wallEdge;
    ctx.fillRect(x + 1, y + 1, CELL_PX - 1, 4);
  }
}

/** PP2倍のバッテリーは、色だけに頼らず「2」の印でも見分けられるようにする */
function drawBattery(ctx: Ctx, battery: Cell, kind: BatteryKind): void {
  const { x, y } = px(battery);
  const double = kind === "doublePp";
  const w = CELL_PX * (double ? 0.55 : 0.45);
  const h = CELL_PX * 0.65;
  const left = x + (CELL_PX - w) / 2;
  const top = y + (CELL_PX - h) / 2 + 2;
  ctx.fillStyle = double ? COLORS.doubleBatteryCap : COLORS.batteryCap;
  ctx.fillRect(left + w / 4, top - 4, w / 2, 4);
  ctx.fillStyle = double ? COLORS.doubleBattery : COLORS.battery;
  ctx.fillRect(left, top, w, h);
  if (!double) return;
  ctx.fillStyle = COLORS.doubleBatteryMark;
  ctx.font = `bold ${Math.round(h * 0.7)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("2", left + w / 2, top + h / 2 + 1);
}

function drawGoal(ctx: Ctx, goal: Cell): void {
  const { x, y } = px(goal);
  ctx.strokeStyle = COLORS.goal;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 5, y + 5, CELL_PX - 10, CELL_PX - 10);
  ctx.fillStyle = COLORS.goal;
  ctx.fillRect(x + 11, y + 11, CELL_PX - 22, CELL_PX - 22);
}

function drawHearts(ctx: Ctx, hearts: readonly Cell[]): void {
  ctx.fillStyle = COLORS.heart;
  for (const heart of hearts) {
    const { x, y } = px(heart);
    const cx = x + CELL_PX / 2;
    const top = y + CELL_PX * 0.32;
    const r = CELL_PX * 0.18;
    ctx.beginPath();
    ctx.arc(cx - r, top, r, Math.PI, 0);
    ctx.arc(cx + r, top, r, Math.PI, 0);
    ctx.lineTo(cx, y + CELL_PX * 0.8);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSnake(ctx: Ctx, body: StageState["body"], movement: Movement | null): void {
  if (movement && Math.floor(movement.invincibleMs / BLINK_INTERVAL_MS) % 2 === 1) return;
  const stunned = movement?.motion.kind === "stunned";
  body.forEach((cell, i) => {
    const { x, y } = px(cell);
    const head = i === 0;
    ctx.fillStyle = stunned
      ? head ? COLORS.stunnedHead : COLORS.stunnedBody
      : head ? COLORS.snakeHead : COLORS.snakeBody;
    const inset = head ? 2 : 4;
    ctx.fillRect(x + inset, y + inset, CELL_PX - inset * 2, CELL_PX - inset * 2);
  });
}
