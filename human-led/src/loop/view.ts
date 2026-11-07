import type { Game } from "../logic/types";

/** ロジックの局面の外にある、画面の状態。ゲームと合わせて「今どの画面か」が決まる */
export type View = {
  readonly onTitle: boolean;
  /** 設定メニュー。ステージ中に開くとゲームを止める */
  readonly menuOpen: boolean;
  /** 調整パネル。開いているあいだはゲームを止める */
  readonly panelOpen: boolean;
};

export const INITIAL_VIEW: View = { onTitle: true, menuOpen: false, panelOpen: false };

export type Screen = "title" | "stage" | "gameOver";

export function screenOf(view: View, game: Game): Screen {
  if (view.onTitle) return "title";
  return game.phase === "gameOver" ? "gameOver" : "stage";
}

/** 設定メニューを閉じたらステージに戻るか（ボタンを「再開」にするか） */
export function menuReturnsToStage(view: View, game: Game): boolean {
  return screenOf(view, game) === "stage" && (game.phase === "awaitingStart" || game.phase === "paused");
}
