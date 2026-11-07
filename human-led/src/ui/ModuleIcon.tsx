import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ModuleId } from "../logic/types";
import type { SpriteKey } from "../render/sprites";
import { useSprites } from "./sprites";

const MODULE_SPRITES: Readonly<Record<ModuleId, SpriteKey>> = {
  doublePpAndGrowth: "moduleDoublePpAndGrowth",
  revive: "moduleRevive",
  reviveAtOneHp: "moduleRevivePartial",
  timeLimitPlus5s: "moduleTimeLimitPlus",
  timeLimitBoostNextStage: "moduleTimeLimitBoost",
  wallDamageImmunity: "moduleWallImmunity",
  maxHpPlus1: "moduleMaxHp",
  doublePpBattery: "moduleDoublePpBattery",
};

/** モジュールの画像。画像がまだないモジュールはnull */
export function useModuleImage(module: ModuleId): string | null {
  return useSprites().urls[MODULE_SPRITES[module]] ?? null;
}

type Props = { readonly module: ModuleId; readonly name: string; readonly className?: string };

/** 画像があれば画像、なければ名前の文字を出す */
export function ModuleImage({ module, name, className }: Props) {
  const url = useModuleImage(module);
  if (!url) return null;
  return <img src={url} alt={name} className={cn("size-10 object-contain", className)} />;
}

/** ステージ中のHUD用。画像だけを出し、重ねた数を右下に小さく出し、マウスを載せると名前を出す */
export function ModuleBadge({ module, name, count }: Props & { readonly count: number }) {
  const url = useModuleImage(module);
  const countLabel = count > 1 && (
    <span className="absolute -right-1 -bottom-1 rounded-full bg-background px-1 text-[11px] leading-tight text-gold tabular-nums">
      {count}
    </span>
  );
  if (!url) {
    return (
      <span className="rounded-full border bg-secondary px-2 py-0.5 text-[13px]">
        {name}
        {count > 1 && <span className="ml-1 text-gold tabular-nums">×{count}</span>}
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative inline-block" tabIndex={0}>
          <img src={url} alt={name} className="size-7 object-contain" />
          {countLabel}
        </span>
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}
