import { boardPx } from "../render/style";

/** 盤面の上の設定ボタンとHUD、下の「方向キーで開始」の高さの合計（目安） */
const AROUND_BOARD = "15rem";

/**
 * 盤面とHUDの表示の幅（CSSの長さ）。画面に収まらなければ縮める。
 * 先生のPCの画面の大きさが分からないので、小さい画面でも盤面とHUDが収まるようにする
 */
export function boardWidth(boardSize: number): string {
  return `min(${boardPx(boardSize)}px, calc(100dvh - ${AROUND_BOARD}), calc(100vw - 2rem))`;
}

/** HUDの幅。盤面が小さくても、ハートや残り時間が詰まらない幅は取る */
export function hudWidth(boardSize: number): string {
  return `max(${boardWidth(boardSize)}, min(24rem, calc(100vw - 2rem)))`;
}
