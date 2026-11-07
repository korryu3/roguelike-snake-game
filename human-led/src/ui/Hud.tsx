import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Messages } from "../i18n/messages";
import { effectsOf } from "../logic/modules";
import type { Game } from "../logic/types";
import { boardPx } from "../render/style";
import { formatRemainingTime } from "./format";
import { ModuleBadge, ModuleImage } from "./ModuleIcon";
import { useSprites } from "./sprites";
import { describeHudModules, type ModuleLine } from "./view";

export function Hud({ game, t }: { game: Game; t: Messages }) {
  const { run } = game;
  const { config } = run.tuning;
  const { maxHp } = effectsOf(run.modules, config);
  const stage = "stage" in game ? game.stage : null;
  const eaten = stage?.batteriesEaten ?? 0;
  const progress = Math.min(1, eaten / config.batteriesToGoal);
  const modules = describeHudModules(run, t);
  const width = boardPx(config.boardSize);
  return (
    <div className="flex flex-col gap-2" style={{ width }}>
      <div className="flex items-center justify-between gap-3 text-lg tabular-nums">
        <Hearts hp={run.hp} maxHp={maxHp} label={t.hud.hp(run.hp, maxHp)} />
        <span>{t.hud.stage(run.stageNumber)}</span>
        <span>{t.hud.pp(run.pp)}</span>
        <span>{stage ? formatRemainingTime(stage.remainingMs) : "-:--"}</span>
      </div>
      <ProgressBar progress={progress} ready={Boolean(stage?.goal)} width={width}>
        {eaten} / {config.batteriesToGoal}
      </ProgressBar>
      <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
        <span className="text-muted-foreground">{t.hud.modules}</span>
        {modules.length === 0 ? (
          <span className="text-muted-foreground">{t.hud.noModules}</span>
        ) : (
          modules.map((m) => (
            <ModuleBadge key={m.module} module={m.module} name={m.name} count={m.count} usedUp={m.usedUp} />
          ))
        )}
      </div>
    </div>
  );
}

/** HPをハートの画像で並べる。画像がなければ文字のハート */
function Hearts({ hp, maxHp, label }: { hp: number; maxHp: number; label: string }) {
  const { urls } = useSprites();
  if (!urls.heart || !urls.heartDamaged) {
    return (
      <span className="text-[22px] tracking-[2px] text-heart" aria-label={label}>
        {"♥".repeat(Math.max(0, hp))}
        <span className="text-heart-empty">{"♡".repeat(Math.max(0, maxHp - hp))}</span>
      </span>
    );
  }
  return (
    <span className="flex gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: maxHp }, (_, i) => (
        <img key={i} src={i < hp ? urls.heart : urls.heartDamaged} alt="" className="size-6 object-contain" />
      ))}
    </span>
  );
}

type ProgressProps = {
  readonly progress: number;
  /** ゴールが出たら光らせる */
  readonly ready: boolean;
  readonly width: number;
  readonly children: ReactNode;
};

/** 進行バー。画像があれば、空の画像の上に、満タンの画像を幅で切り取って重ねる */
function ProgressBar({ progress, ready, width, children }: ProgressProps) {
  const { urls } = useSprites();
  const { progressEmpty, progressFull } = urls;
  const images = progressEmpty !== undefined && progressFull !== undefined;
  return (
    <div
      className={cn("relative h-[18px] overflow-hidden rounded-full", !images && "bg-muted")}
      style={images ? { background: `url(${progressEmpty}) center / 100% 100%` } : undefined}
    >
      <div
        className={cn(
          "h-full transition-[width] duration-120 ease-linear",
          ready && "animate-glow",
          !images && (ready ? "bg-gold" : "bg-success"),
        )}
        style={{
          width: `${progress * 100}%`,
          ...(images && { background: `url(${progressFull}) left / ${width}px 100%` }),
        }}
      />
      <span className="absolute inset-0 grid place-items-center text-xs font-bold text-primary-foreground">
        {children}
      </span>
    </div>
  );
}

/** ゲームオーバー画面用。画像と名前を並べる */
export function ModuleChips({ lines, t, empty }: { lines: readonly ModuleLine[]; t: Messages; empty: string }) {
  if (lines.length === 0) return <span className="text-muted-foreground">{empty}</span>;
  return lines.map((m) => (
    <span key={m.module} className="flex items-center gap-1 rounded-full border bg-secondary px-2 py-0.5 text-[13px]">
      <ModuleImage module={m.module} name="" className="size-5" />
      {m.name}
      {m.count > 1 && <span className="ml-1 text-gold tabular-nums">{t.count(m.count)}</span>}
    </span>
  ));
}
