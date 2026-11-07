import { useLayoutEffect, useRef, useState } from "react";
import type { Game } from "../logic/types";
import { drawGame } from "../render/draw";
import { boardPx, readBoardColors } from "../render/style";

export function Board({ game }: { game: Game }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = window.devicePixelRatio || 1;
  const size = boardPx(game.run.tuning.config.boardSize);
  // テーマの色は遊んでいるあいだ変わらないので、最初に1回だけ読む
  const [colors] = useState(() => {
    const style = getComputedStyle(document.documentElement);
    return readBoardColors((name) => style.getPropertyValue(name));
  });

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGame(ctx, game, colors);
  }, [game, dpr, colors]);

  return (
    <canvas ref={ref} width={size * dpr} height={size * dpr} className="block" style={{ width: size, height: size }} />
  );
}
