import { CONFIG } from "../config";
import type { ModuleId } from "./types";

export type Effects = { readonly maxHp: number; readonly timeLimitMs: number };

export function effectsOf(modules: readonly ModuleId[]): Effects {
  const count = (id: ModuleId) => modules.filter((m) => m === id).length;
  return {
    maxHp: CONFIG.initialHp + count("maxHpPlus1"),
    timeLimitMs:
      CONFIG.timeLimitMs +
      count("timeLimitPlus5s") * CONFIG.timeLimitPlusMs +
      count("timeLimitBoostNextStage") * CONFIG.timeLimitBoostMs,
  };
}

/** 生き返るモジュールごとの、生き返ったときのHP */
export const REVIVE_HP: Partial<Record<ModuleId, (maxHp: number) => number>> = {
  revive: (maxHp) => maxHp,
  reviveAtOneHp: () => 1,
};

/** ステージの開始時に使い切るモジュールを外す */
export const consumeAtStageStart = (modules: readonly ModuleId[]) => modules.filter((m) => m !== "timeLimitBoostNextStage");
