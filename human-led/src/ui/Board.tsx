import { useLayoutEffect, useRef, useState } from "react";
import type { Game } from "../logic/types";
import { drawGame } from "../render/draw";
import { boardPx, readBoardColors } from "../render/style";
import { boardWidth } from "./layout";
import { useSprites } from "./sprites";

export function Board({ game }: { game: Game }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = window.devicePixelRatio || 1;
  const size = boardPx(game.run.tuning.config.boardSize);
  // テーマの色は遊んでいるあいだ変わらないので、最初に1回だけ読む
  const [colors] = useState(() => {
    const style = getComputedStyle(document.documentElement);
    return readBoardColors((name) => style.getPropertyValue(name));
  });

  const { images } = useSprites();

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGame(ctx, game, colors, images);
  }, [game, dpr, colors, images]);

  return (
    // 描くときの大きさは変えず、表示だけを画面に合わせて縮める
    <canvas
      ref={ref}
      width={size * dpr}
      height={size * dpr}
      className="block"
      style={{ width: boardWidth(game.run.tuning.config.boardSize), aspectRatio: "1" }}
    />
  );
}
