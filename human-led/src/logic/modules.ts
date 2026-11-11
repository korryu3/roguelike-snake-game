import type { Config } from "../config";
import type { ModuleId } from "./types";

export type Effects = {
  readonly maxHp: number;
  readonly timeLimitMs: number;
  /** バッテリー1個で得るPPと伸びの倍率 */
  readonly batteryMultiplier: number;
  readonly doublePpBatteryChance: number;
  /** 1マス進む間隔。移動速度アップ・ダウンの倍率で割る */
  readonly moveIntervalMs: number;
  /** モジュールの候補が1つ増える確率 */
  readonly extraModuleChoiceChance: number;
};

export function effectsOf(modules: readonly ModuleId[], config: Config): Effects {
  const count = (id: ModuleId) => modules.filter((m) => m === id).length;
  return {
    maxHp: config.initialHp + count("maxHpPlus1"),
    timeLimitMs:
      config.timeLimitMs +
      count("timeLimitPlus5s") * config.timeLimitPlusMs +
      count("timeLimitBoostNextStage") * config.timeLimitBoostMs,
    batteryMultiplier: 1 + count("doublePpAndGrowth"),
    doublePpBatteryChance: count("doublePpBattery") * config.doublePpBatteryChancePerStack,
    extraModuleChoiceChance: count("extraModuleChoice") * config.extraModuleChoiceChancePerStack,
    moveIntervalMs:
      config.moveIntervalMs /
      (config.fasterMovementMultiplier ** count("fasterMovement") *
        config.slowerMovementMultiplier ** count("slowerMovement")),
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
export const consumeAtStageStart = (modules: readonly ModuleId[]) =>
  modules.filter((m) => m !== "timeLimitBoostNextStage");
