import { DEFAULT_TUNING, type Tuning } from "../config";
import { giveUp, nextStage, revive, startRun, step } from "../logic/game";
import { buyModule, openShop, reroll } from "../logic/shop";
import type { Direction, Game, ModuleId, StepResult } from "../logic/types";
import type { KeyCommand } from "./keys";
import { createStore, type Store } from "./store";

type ReadonlyStore<T> = Pick<Store<T>, "getSnapshot" | "subscribe">;

/** 画面のボタンから送る操作 */
export type ScreenAction =
  | { readonly kind: "openShop" }
  | { readonly kind: "buy"; readonly offerIndex: number }
  | { readonly kind: "reroll" }
  | { readonly kind: "nextStage" }
  | { readonly kind: "revive"; readonly module: ModuleId }
  | { readonly kind: "giveUp" };

export type Session = {
  readonly store: ReadonlyStore<Game>;
  /** 調整パネルを開いているあいだは、ゲームを止める */
  readonly panelOpen: ReadonlyStore<boolean>;
  readonly command: (command: KeyCommand) => void;
  readonly advance: (elapsedMs: number) => void;
  /** その局面でできない操作は何も変えない */
  readonly perform: (action: ScreenAction) => void;
  /** 局面によらず、渡した数値で新しいランを始める */
  readonly restart: (tuning: Tuning) => void;
};

function applyAction(game: Game, action: ScreenAction): StepResult {
  switch (action.kind) {
    case "openShop":
      return openShop(game);
    case "buy":
      return buyModule(game, action.offerIndex);
    case "reroll":
      return reroll(game);
    case "nextStage":
      return nextStage(game);
    case "revive":
      return revive(game, action.module);
    case "giveUp":
      return giveUp(game);
  }
}

export function createSession(
  newSeed: () => number,
  initialTuning: Tuning = DEFAULT_TUNING,
  newGame: (seed: number, tuning: Tuning) => Game = (seed, tuning) => startRun(seed, { tuning }),
): Session {
  const newRun = (tuning: Tuning) => newGame(newSeed(), tuning);
  const store = createStore(newRun(initialTuning));
  const panelOpen = createStore(false);
  let pressed: Direction[] = [];
  return {
    store,
    panelOpen,
    command: (command) => {
      if (command.kind === "togglePanel") return panelOpen.set(!panelOpen.getSnapshot());
      if (panelOpen.getSnapshot()) return;
      pressed.push(command.direction);
    },
    advance: (elapsedMs) => {
      if (panelOpen.getSnapshot()) return;
      const input = pressed;
      pressed = [];
      store.set(step(store.getSnapshot(), input, elapsedMs).game);
    },
    perform: (action) => {
      store.set(applyAction(store.getSnapshot(), action).game);
    },
    restart: (tuning) => {
      store.set(newRun(tuning));
      panelOpen.set(false);
    },
  };
}
