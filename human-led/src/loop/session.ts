import { DEFAULT_TUNING, type Tuning } from "../config";
import { startRun, step } from "../logic/game";
import type { Direction, Game } from "../logic/types";
import type { KeyCommand } from "./keys";
import { createStore, type Store } from "./store";

type ReadonlyStore<T> = Pick<Store<T>, "getSnapshot" | "subscribe">;

export type Session = {
  readonly store: ReadonlyStore<Game>;
  /** 調整パネルを開いているあいだは、ゲームを止める */
  readonly panelOpen: ReadonlyStore<boolean>;
  readonly command: (command: KeyCommand) => void;
  readonly advance: (elapsedMs: number) => void;
  /** 局面によらず、渡した数値で新しいランを始める */
  readonly restart: (tuning: Tuning) => void;
};

const RESTARTABLE: ReadonlySet<Game["phase"]> = new Set(["cleared", "gameOver"]);

export function createSession(newSeed: () => number, initialTuning: Tuning = DEFAULT_TUNING): Session {
  const newRun = (tuning: Tuning) => startRun(newSeed(), { tuning });
  const store = createStore(newRun(initialTuning));
  const panelOpen = createStore(false);
  let pressed: Direction[] = [];
  return {
    store,
    panelOpen,
    command: (command) => {
      if (command.kind === "togglePanel") return panelOpen.set(!panelOpen.getSnapshot());
      if (panelOpen.getSnapshot()) return;
      const game = store.getSnapshot();
      if (command.kind === "direction") pressed.push(command.direction);
      else if (RESTARTABLE.has(game.phase)) store.set(newRun(game.run.tuning));
    },
    advance: (elapsedMs) => {
      if (panelOpen.getSnapshot()) return;
      const input = pressed;
      pressed = [];
      store.set(step(store.getSnapshot(), input, elapsedMs).game);
    },
    restart: (tuning) => {
      store.set(newRun(tuning));
      panelOpen.set(false);
    },
  };
}
