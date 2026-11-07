import { describe, expect, test } from "vite-plus/test";
import { floorTile, snakeParts, spriteUrls, wallSprite } from "./sprites";

describe("snakeParts", () => {
  // 頭(5,5)から左へ体が伸び、(3,5)で下へ曲がっている
  const body = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 3, y: 6 },
  ];

  test("頭は頭の絵で、進む向きに回す", () => {
    expect(snakeParts(body, "right")[0]).toEqual({ cell: { x: 5, y: 5 }, sprite: "snakeHead", degrees: 90 });
    expect(snakeParts(body, "down")[0]?.degrees).toBe(180);
    expect(snakeParts(body, "left")[0]?.degrees).toBe(270);
  });

  test("体は頭から数えて、body1、body2、body1…と交互にする", () => {
    expect(snakeParts(body, "right").map((p) => p.sprite)).toEqual([
      "snakeHead",
      "snakeBody1",
      "snakeBody2",
      "snakeBody1",
    ]);
  });

  test("体の各マスは、ひとつ前（頭の側）のマスへ向かう向きに回す", () => {
    expect(snakeParts(body, "right").map((p) => p.degrees)).toEqual([90, 90, 90, 0]);
  });

  test("動き出す前（向きがない）の頭は、上を向く", () => {
    expect(snakeParts([{ x: 9, y: 9 }], null)).toEqual([{ cell: { x: 9, y: 9 }, sprite: "snakeHead", degrees: 0 }]);
  });
});

describe("wallSprite", () => {
  const walls = [
    { x: 2, y: 2 },
    { x: 2, y: 3 },
  ];

  test("下のマスも壁なら、上面だけの絵", () => {
    expect(wallSprite(walls, { x: 2, y: 2 })).toBe("wallTop");
  });

  test("下のマスが壁でなければ、側面のある絵", () => {
    expect(wallSprite(walls, { x: 2, y: 3 })).toBe("wall");
  });
});

describe("floorTile", () => {
  const center = { x: 9, y: 9 };

  test("中央のマスは中央のタイル", () => {
    expect(floorTile(center, center)).toBe("floorCenter");
  });

  test("それ以外は、マスの位置で明るいタイルと暗いタイルを市松模様に交互にする", () => {
    expect([
      floorTile({ x: 0, y: 0 }, center),
      floorTile({ x: 1, y: 0 }, center),
      floorTile({ x: 1, y: 1 }, center),
    ]).toEqual(["floorLight", "floorDark", "floorLight"]);
  });
});

describe("spriteUrls", () => {
  test("置いてある画像のファイル名から、絵の名前で引ける。置いていない画像は入らない", () => {
    const urls = spriteUrls({
      "../assets/images/wall.png": "data:wall",
      "../assets/images/double-battery.png": "data:double",
    });
    expect(urls).toEqual({ wall: "data:wall", doubleBattery: "data:double", moduleDoublePpBattery: "data:double" });
  });
});

describe("loadSprites", () => {
  test("読み込む画像の名前の一覧が、SPRITE_FILESとそろっている", async () => {
    const { readFileSync } = await import("node:fs");
    const { SPRITE_FILES } = await import("./sprites");
    const source = readFileSync(new URL("./loadSprites.ts", import.meta.url), "utf8");
    const listed = /\{([a-z0-9,-]+)\}\.png/.exec(source)?.[1]?.split(",") ?? [];
    const expected = [...new Set(Object.values(SPRITE_FILES).map((file) => file.replace(/\.png$/, "")))];
    expect(listed.toSorted()).toEqual(expected.toSorted());
  });
});
