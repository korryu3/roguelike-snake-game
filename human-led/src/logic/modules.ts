import { CONFIG } from "../config";
import type { ModuleId } from "./types";

export type Effects = {
  readonly maxHp: number;
  readonly timeLimitMs: number;
  /** バッテリー1個で得るPPと伸びの倍率 */
  readonly batteryMultiplier: number;
  readonly doublePpBatteryChance: number;
};

export function effectsOf(modules: readonly ModuleId[]): Effects {
  const count = (id: ModuleId) => modules.filter((m) => m === id).length;
  return {
    maxHp: CONFIG.initialHp + count("maxHpPlus1"),
    timeLimitMs:
      CONFIG.timeLimitMs +
      count("timeLimitPlus5s") * CONFIG.timeLimitPlusMs +
      count("timeLimitBoostNextStage") * CONFIG.timeLimitBoostMs,
    batteryMultiplier: 1 + count("doublePpAndGrowth"),
    doublePpBatteryChance: count("doublePpBattery") * CONFIG.doublePpBatteryChancePerStack,
  };
}

/** 生き返るモジュールごとの、生き返ったときのHP */
export const REVIVE_HP: Partial<Record<ModuleId, (maxHp: number) => number>> = {
  revive: (maxHp) => maxHp,
  reviveAtOneHp: () => 1,
};

/** 使い切るモジュールを1つ使った後の一覧。持っていなければnull */
export function consumeOne(modules: readonly ModuleId[], id: ModuleId): readonly ModuleId[] | null {
  const index = modules.indexOf(id);
  return index < 0 ? null : modules.filter((_, i) => i !== index);
}

/** ステージの開始時に使い切るモジュールを外す */
export const consumeAtStageStart = (modules: readonly ModuleId[]) => modules.filter((m) => m !== "timeLimitBoostNextStage");
