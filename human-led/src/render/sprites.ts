import type { Cell, Direction } from "../logic/types";

/** 素材の画像の名前。画像のファイルがまだないものは、図形や文字で代わりに出す */
export const SPRITE_FILES = {
  snakeHead: "snake-head.png",
  snakeBody1: "snake-body-1.png",
  snakeBody2: "snake-body-2.png",
  wall: "wall.png",
  wallTop: "wall-top.png",
  battery: "battery.png",
  doubleBattery: "double-battery.png",
  heart: "heart.png",
  heartDamaged: "heart-damaged.png",
  goal: "goal.png",
  floorLight: "floor-light.png",
  floorDark: "floor-dark.png",
  floorCenter: "floor-center.png",
  progressEmpty: "progress-empty.png",
  progressFull: "progress-full.png",
  buttonLight: "button-light.png",
  buttonDark: "button-dark.png",
  moduleDoublePpAndGrowth: "module-double-pp-and-growth.png",
  moduleRevive: "module-revive.png",
  moduleRevivePartial: "module-revive-partial.png",
  moduleTimeLimitPlus: "module-time-limit-plus.png",
  moduleTimeLimitBoost: "module-time-limit-boost.png",
  moduleWallImmunity: "module-wall-immunity.png",
  moduleMaxHp: "module-max-hp.png",
  moduleDoublePpBattery: "double-battery.png",
} as const;

export type SpriteKey = keyof typeof SPRITE_FILES;

export type SpriteUrls = Readonly<Partial<Record<SpriteKey, string>>>;

/** 見つかった画像（ファイル名からURL）を、絵の名前で引けるようにする */
export function spriteUrls(found: Readonly<Record<string, string>>): SpriteUrls {
  const byFile = new Map(Object.entries(found).map(([path, url]) => [path.split("/").at(-1), url]));
  return Object.fromEntries(
    (Object.keys(SPRITE_FILES) as SpriteKey[]).flatMap((key) => {
      const url = byFile.get(SPRITE_FILES[key]);
      return url === undefined ? [] : [[key, url]];
    }),
  );
}

export type SnakeSprite = "snakeHead" | "snakeBody1" | "snakeBody2";

/** 絵は上向きに描かれているので、上を0度として時計回りに回す */
export type SnakePart = { readonly cell: Cell; readonly sprite: SnakeSprite; readonly degrees: number };

const DEGREES: Readonly<Record<Direction, number>> = { up: 0, right: 90, down: 180, left: 270 };

/** fromからtoへ1マス進む向き。体をすり抜けて重なったマスなど、隣り合っていなければ上 */
const degreesBetween = (from: Cell, to: Cell): number => {
  if (to.x > from.x) return DEGREES.right;
  if (to.x < from.x) return DEGREES.left;
  if (to.y > from.y) return DEGREES.down;
  return DEGREES.up;
};

export function snakeParts(body: readonly Cell[], headDirection: Direction | null): SnakePart[] {
  return body.map((cell, i) => {
    if (i === 0) return { cell, sprite: "snakeHead", degrees: headDirection ? DEGREES[headDirection] : DEGREES.up };
    const ahead = body[i - 1] ?? cell;
    return { cell, sprite: i % 2 === 1 ? "snakeBody1" : "snakeBody2", degrees: degreesBetween(cell, ahead) };
  });
}

/** 下も壁なら側面を隠してつなげる。側面は下のマスにはみ出して描くので、下に壁があると重なってしまう */
export function wallSprite(walls: readonly Cell[], cell: Cell): "wall" | "wallTop" {
  return walls.some((w) => w.x === cell.x && w.y === cell.y + 1) ? "wallTop" : "wall";
}

export function floorTile(cell: Cell, center: Cell): "floorLight" | "floorDark" | "floorCenter" {
  if (cell.x === center.x && cell.y === center.y) return "floorCenter";
  return (cell.x + cell.y) % 2 === 0 ? "floorLight" : "floorDark";
}
