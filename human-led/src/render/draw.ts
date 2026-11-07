import { centerOf } from "../logic/board";
import type { BatteryKind, Cell, Game, Movement, StageState } from "../logic/types";
import { floorTile, type SpriteKey, snakeParts, wallSprite } from "./sprites";
import { BLINK_INTERVAL_MS, type BoardColors, boardPx, CELL_PX } from "./style";

type Ctx = CanvasRenderingContext2D;

/** 読み込めた画像。ないものは図形で描く */
export type SpriteImages = Readonly<Partial<Record<SpriteKey, HTMLImageElement>>>;

type Painter = { readonly ctx: Ctx; readonly colors: BoardColors; readonly images: SpriteImages };

const px = (cell: Cell) => ({ x: cell.x * CELL_PX, y: cell.y * CELL_PX });

export function drawGame(ctx: Ctx, game: Game, colors: BoardColors, images: SpriteImages = {}): void {
  if (!("stage" in game)) return;
  const p: Painter = { ctx, colors, images };
  const { stage } = game;
  const { boardSize } = game.run.tuning.config;
  drawFloor(p, boardSize);
  drawWalls(p, stage.walls);
  drawBattery(p, stage.battery, stage.batteryKind);
  if (stage.goal) drawGoal(p, stage.goal);
  drawHearts(p, stage.hearts);
  const movement = "movement" in game ? game.movement : null;
  drawSnake(p, stage.body, movement);
}

/** 画像を、縦横比を保ったままマスに収まる大きさで、マスの中央に描く。degreesだけ回す */
function drawInCell(
  ctx: Ctx,
  image: CanvasImageSource & { width: number; height: number },
  cell: Cell,
  degrees = 0,
  scale = 1,
) {
  const { x, y } = px(cell);
  const fit = (CELL_PX * scale) / Math.max(image.width, image.height);
  const w = image.width * fit;
  const h = image.height * fit;
  ctx.save();
  ctx.translate(x + CELL_PX / 2, y + CELL_PX / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(image, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawFloor({ ctx, colors, images }: Painter, boardSize: number): void {
  const center = centerOf(boardSize);
  const { floorLight, floorDark, floorCenter } = images;
  if (floorLight && floorDark && floorCenter) {
    const tiles = { floorLight, floorDark, floorCenter };
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        ctx.drawImage(tiles[floorTile({ x, y }, center)], x * CELL_PX, y * CELL_PX, CELL_PX, CELL_PX);
      }
    }
    return;
  }
  const size = boardPx(boardSize);
  ctx.fillStyle = colors.floor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = colors.gridLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= size; i += CELL_PX) {
    ctx.moveTo(i + 0.5, 0);
    ctx.lineTo(i + 0.5, size);
    ctx.moveTo(0, i + 0.5);
    ctx.lineTo(size, i + 0.5);
  }
  ctx.stroke();
  const { x, y } = px(center);
  ctx.fillStyle = colors.center;
  ctx.fillRect(x + 1, y + 1, CELL_PX - 1, CELL_PX - 1);
}

/** 側面のある壁の画像は縦長なので、幅をマスに合わせ、側面の分は下のマスにはみ出して描く */
function drawWalls({ ctx, colors, images }: Painter, walls: readonly Cell[]): void {
  // 下の行ほど手前に見えるように、上の行から描く
  for (const wall of walls.toSorted((a, b) => a.y - b.y)) {
    const { x, y } = px(wall);
    const image = images[wallSprite(walls, wall)];
    if (image) {
      ctx.drawImage(image, x, y, CELL_PX, (CELL_PX * image.height) / image.width);
      continue;
    }
    ctx.fillStyle = colors.wall;
    ctx.fillRect(x + 1, y + 1, CELL_PX - 1, CELL_PX - 1);
    ctx.fillStyle = colors.wallEdge;
    ctx.fillRect(x + 1, y + 1, CELL_PX - 1, 4);
  }
}

/** PP2倍のバッテリーは、色だけに頼らず「2」の印でも見分けられるようにする */
function drawBattery({ ctx, colors, images }: Painter, battery: Cell, kind: BatteryKind): void {
  const double = kind === "doublePp";
  const image = images[double ? "doubleBattery" : "battery"];
  if (image) {
    drawInCell(ctx, image, battery, 0, 0.85);
    return;
  }
  const { x, y } = px(battery);
  const w = CELL_PX * (double ? 0.55 : 0.45);
  const h = CELL_PX * 0.65;
  const left = x + (CELL_PX - w) / 2;
  const top = y + (CELL_PX - h) / 2 + 2;
  ctx.fillStyle = double ? colors.doubleBatteryCap : colors.batteryCap;
  ctx.fillRect(left + w / 4, top - 4, w / 2, 4);
  ctx.fillStyle = double ? colors.doubleBattery : colors.battery;
  ctx.fillRect(left, top, w, h);
  if (!double) return;
  ctx.fillStyle = colors.doubleBatteryMark;
  ctx.font = `bold ${Math.round(h * 0.7)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("2", left + w / 2, top + h / 2 + 1);
}

function drawGoal({ ctx, colors, images }: Painter, goal: Cell): void {
  if (images.goal) {
    drawInCell(ctx, images.goal, goal);
    return;
  }
  const { x, y } = px(goal);
  ctx.strokeStyle = colors.goal;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 5, y + 5, CELL_PX - 10, CELL_PX - 10);
  ctx.fillStyle = colors.goal;
  ctx.fillRect(x + 11, y + 11, CELL_PX - 22, CELL_PX - 22);
}

function drawHearts({ ctx, colors, images }: Painter, hearts: readonly Cell[]): void {
  for (const heart of hearts) {
    if (images.heart) {
      drawInCell(ctx, images.heart, heart, 0, 0.8);
      continue;
    }
    ctx.fillStyle = colors.heart;
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

/** 点滅のうち、スネークを消しているあいだはfalse */
export function snakeVisible(movement: Movement | null): boolean {
  if (!movement) return true;
  const { motion, invincibleMs } = movement;
  const blinkingMs = motion.kind === "stunned" ? motion.remainingMs : invincibleMs;
  return Math.floor(blinkingMs / BLINK_INTERVAL_MS) % 2 === 0;
}

function drawSnake(p: Painter, body: StageState["body"], movement: Movement | null): void {
  if (!snakeVisible(movement)) return;
  const stunned = movement?.motion.kind === "stunned";
  const { ctx, colors, images } = p;
  const parts = snakeParts(body, movement?.direction ?? null);
  // 頭が一番上に重なるように、尻尾から描く
  for (const part of parts.toReversed()) {
    const image = images[part.sprite];
    if (image) {
      drawInCell(ctx, stunned ? tinted(image, colors.stunnedBody) : image, part.cell, part.degrees);
      continue;
    }
    const { x, y } = px(part.cell);
    const head = part.sprite === "snakeHead";
    ctx.fillStyle = stunned
      ? head
        ? colors.stunnedHead
        : colors.stunnedBody
      : head
        ? colors.snakeHead
        : colors.snakeBody;
    const inset = head ? 2 : 4;
    ctx.fillRect(x + inset, y + inset, CELL_PX - inset * 2, CELL_PX - inset * 2);
  }
}

const tintCache = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>();

/** 止まっているあいだは、同じ画像に色をかぶせて表す（専用の画像は作らない） */
function tinted(image: HTMLImageElement, color: string): HTMLCanvasElement {
  const byColor = tintCache.get(image) ?? new Map<string, HTMLCanvasElement>();
  tintCache.set(image, byColor);
  const cached = byColor.get(color);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  byColor.set(color, canvas);
  return canvas;
}
