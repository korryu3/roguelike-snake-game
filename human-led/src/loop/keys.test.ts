import { describe, expect, test } from "vite-plus/test";
import { commandOfKey, isTypingTarget } from "./keys";

const direction = (d: string) => ({ kind: "direction", direction: d });

describe("commandOfKey", () => {
  test("WASDは上・左・下・右の方向になる", () => {
    expect(["KeyW", "KeyA", "KeyS", "KeyD"].map(commandOfKey)).toEqual(["up", "left", "down", "right"].map(direction));
  });

  test("矢印キーは上・左・下・右の方向になる", () => {
    expect(["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].map(commandOfKey)).toEqual(
      ["up", "left", "down", "right"].map(direction),
    );
  });

  test("Tは調整パネルの開閉になる", () => {
    expect(commandOfKey("KeyT")).toEqual({ kind: "togglePanel" });
  });

  test("Escは設定メニューの開閉になる", () => {
    expect(commandOfKey("Escape")).toEqual({ kind: "toggleMenu" });
  });

  test("ほかのキーは何にもならない", () => {
    expect(["KeyQ", "KeyR", "Space", "Enter"].map(commandOfKey)).toEqual([null, null, null, null]);
  });
});

describe("isTypingTarget", () => {
  const element = (tagName: string, isContentEditable = false) => ({ tagName, isContentEditable });

  test("入力欄・テキスト欄・選択欄・編集可能な要素へのキーは、ゲームの操作にしない", () => {
    expect(
      [element("INPUT"), element("TEXTAREA"), element("SELECT"), element("DIV", true)].map(isTypingTarget),
    ).toEqual([true, true, true, true]);
  });

  test("それ以外の要素へのキーは、ゲームの操作にする", () => {
    expect([element("BODY"), element("BUTTON"), element("CANVAS")].map(isTypingTarget)).toEqual([false, false, false]);
  });
});
