import type { Game } from "../logic/types";
import { boardPx } from "../render/style";
import { formatRemainingTime } from "./format";

export function Hud({ game }: { game: Game }) {
  const { run } = game;
  const { config } = run.tuning;
  const stage = "stage" in game ? game.stage : null;
  const eaten = stage?.batteriesEaten ?? 0;
  const progress = Math.min(1, eaten / config.batteriesToGoal);
  return (
    <div className="hud" style={{ width: boardPx(config.boardSize) }}>
      <div className="hud-row">
        <span className="hearts" aria-label={`HP ${run.hp}`}>
          {"♥".repeat(Math.max(0, run.hp))}
          <span className="hearts-empty">{"♡".repeat(Math.max(0, config.initialHp - run.hp))}</span>
        </span>
        <span>ステージ {run.stageNumber}</span>
        <span>PP {run.pp}</span>
        <span className="timer">{stage ? formatRemainingTime(stage.remainingMs) : "-:--"}</span>
      </div>
      <div className={`progress${stage?.goal ? " progress-ready" : ""}`}>
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        <span className="progress-label">
          {eaten} / {config.batteriesToGoal}
        </span>
      </div>
    </div>
  );
}
