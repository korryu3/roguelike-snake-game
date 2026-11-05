import { describe, expect, test } from "vitest";
import { commandOfKey } from "./keys";

const direction = (d: string) => ({ kind: "direction", direction: d });

describe("commandOfKey", () => {
  test("WASDは上・左・下・右の方向になる", () => {
    expect(["KeyW", "KeyA", "KeyS", "KeyD"].map(commandOfKey)).toEqual(
      ["up", "left", "down", "right"].map(direction),
    );
  });

  test("矢印キーは上・左・下・右の方向になる", () => {
    expect(["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].map(commandOfKey)).toEqual(
      ["up", "left", "down", "right"].map(direction),
    );
  });

  test("Rはやり直しになる", () => {
    expect(commandOfKey("KeyR")).toEqual({ kind: "restart" });
  });

  test("ほかのキーは何にもならない", () => {
    expect(["KeyQ", "Space", "Enter"].map(commandOfKey)).toEqual([null, null, null]);
  });
});
