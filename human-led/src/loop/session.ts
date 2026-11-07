import { DEFAULT_TUNING, type Tuning } from "../config";
import { giveUp, nextStage, pause, revive, startRun, step } from "../logic/game";
import { buyModule, openShop, reroll } from "../logic/shop";
import type { Direction, Game, GameEvent, ModuleId, StepResult } from "../logic/types";
import type { KeyCommand } from "./keys";
import { createStore, type Store } from "./store";
import { INITIAL_VIEW, type View } from "./view";

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
  /** タイトルにいるか、設定メニューと調整パネルが開いているか */
  readonly view: ReadonlyStore<View>;
  readonly command: (command: KeyCommand) => void;
  readonly advance: (elapsedMs: number) => void;
  /** その局面でできない操作は何も変えない */
  readonly perform: (action: ScreenAction) => void;
  /** 局面によらず、渡した数値で新しいランを始める。タイトルにいるかは変えない */
  readonly restart: (tuning: Tuning) => void;
  /** 今のランと同じ数値で新しいランを始め、タイトルを出る */
  readonly startNewRun: () => void;
  readonly goToTitle: () => void;
  /** ステージ中なら止める（タブを離れたとき）。方向キーで再開する */
  readonly pause: () => void;
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
  const view = createStore<View>(INITIAL_VIEW);
  const setView = (patch: Partial<View>) => view.set({ ...view.getSnapshot(), ...patch });
  // タイトルにいるあいだと、調整パネルか設定メニューが開いているあいだは、ゲームを進めない
  const halted = () => view.getSnapshot().onTitle || view.getSnapshot().panelOpen || view.getSnapshot().menuOpen;
  let pressed: Direction[] = [];
  const listeners = new Set<(change: Change) => void>();
  const commit = (next: Game, events: readonly GameEvent[]) => {
    const prev = store.getSnapshot();
    store.set(next);
    for (const listener of listeners) listener({ prev, next, events });
  };
  // 止めたら、方向キーを押すまで止まったまま（再開した直後にぶつかるのは理不尽なため）
  const pauseGame = () => {
    const { game, events } = pause(store.getSnapshot());
    if (game !== store.getSnapshot()) commit(game, events);
  };
  const restart = (tuning: Tuning) => {
    commit(newRun(tuning), []);
    setView({ panelOpen: false });
  };
  return {
    store,
    view,
    command: (command) => {
      if (command.kind === "togglePanel" || command.kind === "toggleMenu") {
        const key = command.kind === "togglePanel" ? "panelOpen" : "menuOpen";
        const opening = !view.getSnapshot()[key];
        setView({ [key]: opening });
        if (opening) pauseGame();
        return;
      }
      if (halted()) return;
      pressed.push(command.direction);
    },
    advance: (elapsedMs) => {
      if (halted()) return;
      const input = pressed;
      pressed = [];
      const { game, events } = step(store.getSnapshot(), input, elapsedMs);
      commit(game, events);
    },
    perform: (action) => {
      const { game, events } = applyAction(store.getSnapshot(), action);
      commit(game, events);
    },
    restart,
    startNewRun: () => {
      restart(store.getSnapshot().run.tuning);
      setView({ onTitle: false });
    },
    goToTitle: () => setView({ onTitle: true }),
    pause: pauseGame,
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
