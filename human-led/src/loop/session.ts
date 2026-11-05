import { startRun, step } from "../logic/game";
import type { Direction, Game } from "../logic/types";
import type { KeyCommand } from "./keys";
import { createStore, type Store } from "./store";

export type Session = {
  readonly store: Pick<Store<Game>, "getSnapshot" | "subscribe">;
  readonly command: (command: KeyCommand) => void;
  readonly advance: (elapsedMs: number) => void;
};

const RESTARTABLE: ReadonlySet<Game["phase"]> = new Set(["cleared", "gameOver"]);

export function createSession(newSeed: () => number): Session {
  const store = createStore(startRun(newSeed()));
  let pressed: Direction[] = [];
  return {
    store,
    command: (command) => {
      if (command.kind === "direction") pressed.push(command.direction);
      else if (RESTARTABLE.has(store.getSnapshot().phase)) store.set(startRun(newSeed()));
    },
    advance: (elapsedMs) => {
      const input = pressed;
      pressed = [];
      store.set(step(store.getSnapshot(), input, elapsedMs).game);
    },
  };
}
