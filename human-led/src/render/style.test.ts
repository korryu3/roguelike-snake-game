import { describe, expect, test } from "vite-plus/test";
import { BOARD_COLOR_KEYS, readBoardColors } from "./style";

describe("readBoardColors", () => {
  test("盤面の色を、テーマのCSS変数（--color-で始まり、単語をハイフンでつなぐ）から読む", () => {
    const read = (name: string) => ` ${name} `;
    const colors = readBoardColors(read);
    expect(colors.floor).toBe("--color-board-floor");
    expect(colors.doubleBatteryCap).toBe("--color-double-battery-cap");
    expect(colors.snakeHead).toBe("--color-snake-head");
    expect(Object.keys(colors).toSorted()).toEqual([...BOARD_COLOR_KEYS].toSorted());
  });
});
