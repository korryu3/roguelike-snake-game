import type { Messages } from "../i18n/messages";
import { effectsOf } from "../logic/modules";
import type { Game } from "../logic/types";
import { boardPx } from "../render/style";
import { formatRemainingTime } from "./format";
import { describeModules, type ModuleLine } from "./view";

export function Hud({ game, t }: { game: Game; t: Messages }) {
  const { run } = game;
  const { config } = run.tuning;
  const { maxHp } = effectsOf(run.modules, config);
  const stage = "stage" in game ? game.stage : null;
  const eaten = stage?.batteriesEaten ?? 0;
  const progress = Math.min(1, eaten / config.batteriesToGoal);
  const modules = describeModules(run.purchased, t);
  return (
    <div className="hud" style={{ width: boardPx(config.boardSize) }}>
      <div className="hud-row">
        <span className="hearts" aria-label={t.hud.hp(run.hp, maxHp)}>
          {"♥".repeat(Math.max(0, run.hp))}
          <span className="hearts-empty">{"♡".repeat(Math.max(0, maxHp - run.hp))}</span>
        </span>
        <span>{t.hud.stage(run.stageNumber)}</span>
        <span>{t.hud.pp(run.pp)}</span>
        <span className="timer">{stage ? formatRemainingTime(stage.remainingMs) : "-:--"}</span>
      </div>
      <div className={`progress${stage?.goal ? " progress-ready" : ""}`}>
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        <span className="progress-label">
          {eaten} / {config.batteriesToGoal}
        </span>
      </div>
      <div className="hud-modules">
        <span className="hud-modules-label">{t.hud.modules}</span>
        <ModuleChips lines={modules} t={t} empty={t.hud.noModules} />
      </div>
    </div>
  );
}

export function ModuleChips({ lines, t, empty }: { lines: readonly ModuleLine[]; t: Messages; empty: string }) {
  if (lines.length === 0) return <span className="muted">{empty}</span>;
  return lines.map((m) => (
    <span key={m.module} className="chip">
      {m.name}
      {m.count > 1 && <span className="chip-count">{t.count(m.count)}</span>}
    </span>
  ));
}
