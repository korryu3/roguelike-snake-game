import { cn } from "@/lib/utils";
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
    <div className="flex flex-col gap-2" style={{ width: boardPx(config.boardSize) }}>
      <div className="flex items-center justify-between gap-3 text-lg tabular-nums">
        <span className="text-[22px] tracking-[2px] text-heart" aria-label={t.hud.hp(run.hp, maxHp)}>
          {"♥".repeat(Math.max(0, run.hp))}
          <span className="text-heart-empty">{"♡".repeat(Math.max(0, maxHp - run.hp))}</span>
        </span>
        <span>{t.hud.stage(run.stageNumber)}</span>
        <span>{t.hud.pp(run.pp)}</span>
        <span>{stage ? formatRemainingTime(stage.remainingMs) : "-:--"}</span>
      </div>
      <div className="relative h-[18px] overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full bg-success transition-[width] duration-120 ease-linear",
            stage?.goal && "animate-glow bg-gold",
          )}
          style={{ width: `${progress * 100}%` }}
        />
        <span className="absolute inset-0 grid place-items-center text-xs font-bold text-primary-foreground">
          {eaten} / {config.batteriesToGoal}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
        <span className="text-muted-foreground">{t.hud.modules}</span>
        <ModuleChips lines={modules} t={t} empty={t.hud.noModules} />
      </div>
    </div>
  );
}

export function ModuleChips({ lines, t, empty }: { lines: readonly ModuleLine[]; t: Messages; empty: string }) {
  if (lines.length === 0) return <span className="text-muted-foreground">{empty}</span>;
  return lines.map((m) => (
    <span key={m.module} className="rounded-full border bg-secondary px-2 py-0.5 text-[13px]">
      {m.name}
      {m.count > 1 && <span className="ml-1 text-gold tabular-nums">{t.count(m.count)}</span>}
    </span>
  ));
}
