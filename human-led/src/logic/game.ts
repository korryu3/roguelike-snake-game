import type { Direction, Game, RunSetup, StepResult } from "./types";

export function startRun(_seed: number, _setup: RunSetup = {}): Game {
  throw new Error("not implemented");
}

export function step(_game: Game, _input: readonly Direction[], _elapsedMs: number): StepResult {
  throw new Error("not implemented");
}
