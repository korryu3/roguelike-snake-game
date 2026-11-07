import { useLayoutEffect, useRef } from "react";
import type { Game } from "../logic/types";
import { drawGame } from "../render/draw";
import { boardPx } from "../render/style";

export function Board({ game }: { game: Game }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = window.devicePixelRatio || 1;
  const size = boardPx(game.run.tuning.config.boardSize);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGame(ctx, game);
  }, [game, dpr]);

  return (
    <canvas ref={ref} width={size * dpr} height={size * dpr} style={{ width: size, height: size, display: "block" }} />
  );
}
