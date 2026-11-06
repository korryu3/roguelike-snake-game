import { describe, expect, it } from "vitest";
import type { Movement } from "../logic/types";
import { snakeVisible } from "./draw";
import { BLINK_INTERVAL_MS } from "./style";

const movement = (motion: Movement["motion"], invincibleMs = 0): Movement => ({ direction: "right", queuedInputs: [], motion, invincibleMs });

const stunnedFor = (remainingMs: number) => movement({ kind: "stunned", remainingMs });

describe("snakeVisible", () => {
  it("止まっているあいだは、一定の間隔で消えたり出たりする", () => {
    const visibility = [0.5, 1.5, 2.5, 3.5].map((n) => snakeVisible(stunnedFor(n * BLINK_INTERVAL_MS)));
    expect(visibility).toEqual([true, false, true, false]);
  });

  it("無敵時間中は、一定の間隔で消えたり出たりする", () => {
    const visibility = [0.5, 1.5, 2.5, 3.5].map((n) => snakeVisible(movement({ kind: "moving", sinceLastMoveMs: 0 }, n * BLINK_INTERVAL_MS)));
    expect(visibility).toEqual([true, false, true, false]);
  });

  it("止まっても無敵でもなければ、消えない", () => {
    expect(snakeVisible(movement({ kind: "moving", sinceLastMoveMs: 0 }))).toBe(true);
    expect(snakeVisible(null)).toBe(true);
  });
});
