import { DEFAULT_TUNING, type Tuning } from "../config";
import { giveUp, nextStage, pause, revive, startRun, step } from "../logic/game";
import { buyModule, openShop, reroll } from "../logic/shop";
import type { Direction, Game, GameEvent, ModuleId, StepResult } from "../logic/types";
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

/** 状態が変わるたびに知らせる中身。音を鳴らすのに使う */
export type Change = { readonly prev: Game; readonly next: Game; readonly events: readonly GameEvent[] };

export type Session = {
  readonly store: ReadonlyStore<Game>;
  /** 調整パネルを開いているあいだは、ゲームを止める */
  readonly panelOpen: ReadonlyStore<boolean>;
  /** 設定メニュー。ステージ中に開くとゲームを止める。閉じても、方向キーを押すまで止まったまま */
  readonly menuOpen: ReadonlyStore<boolean>;
  readonly command: (command: KeyCommand) => void;
  readonly advance: (elapsedMs: number) => void;
  /** その局面でできない操作は何も変えない */
  readonly perform: (action: ScreenAction) => void;
  /** 局面によらず、渡した数値で新しいランを始める */
  readonly restart: (tuning: Tuning) => void;
  /** 戻り値を呼ぶと、知らせるのをやめる */
  readonly onChange: (listener: (change: Change) => void) => () => void;
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
  const menuOpen = createStore(false);
  let pressed: Direction[] = [];
  const listeners = new Set<(change: Change) => void>();
  const commit = (next: Game, events: readonly GameEvent[]) => {
    const prev = store.getSnapshot();
    store.set(next);
    for (const listener of listeners) listener({ prev, next, events });
  };
  return {
    store,
    panelOpen,
    menuOpen,
    command: (command) => {
      if (command.kind === "togglePanel") return panelOpen.set(!panelOpen.getSnapshot());
      if (command.kind === "toggleMenu") {
        const opening = !menuOpen.getSnapshot();
        menuOpen.set(opening);
        if (opening) {
          const { game, events } = pause(store.getSnapshot());
          if (game !== store.getSnapshot()) commit(game, events);
        }
        return;
      }
      if (panelOpen.getSnapshot() || menuOpen.getSnapshot()) return;
      pressed.push(command.direction);
    },
    advance: (elapsedMs) => {
      if (panelOpen.getSnapshot() || menuOpen.getSnapshot()) return;
      const input = pressed;
      pressed = [];
      const { game, events } = step(store.getSnapshot(), input, elapsedMs);
      commit(game, events);
    },
    perform: (action) => {
      const { game, events } = applyAction(store.getSnapshot(), action);
      commit(game, events);
    },
    restart: (tuning) => {
      commit(newRun(tuning), []);
      panelOpen.set(false);
    },
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
