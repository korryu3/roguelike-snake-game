import { useLayoutEffect, useRef } from "react";
import type { Game } from "../logic/types";
import { drawGame } from "../render/draw";
import { BOARD_PX } from "../render/style";

export function Board({ game }: { game: Game }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = window.devicePixelRatio || 1;

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGame(ctx, game);
  }, [game, dpr]);

  return (
    <canvas
      ref={ref}
      width={BOARD_PX * dpr}
      height={BOARD_PX * dpr}
      style={{ width: BOARD_PX, height: BOARD_PX, display: "block" }}
    />
  );
}
