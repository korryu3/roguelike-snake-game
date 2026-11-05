import type { ModuleId } from "./logic/types";

export const CONFIG = {
  boardSize: 15,
  moveIntervalMs: 150,
  timeLimitMs: 120_000,
  batteriesToGoal: 8,
  initialHp: 3,
  initialLength: 3,
  ppPerBattery: 1,
  stunMs: 1_000,
  invincibleMs: 1_500,
  inputQueueLimit: 2,
  scorePerBattery: 100,
  timeBonusPerSecond: 10,
  shopOfferCount: 3,
  rerollPrice: 2,
  timeLimitPlusMs: 5_000,
  timeLimitBoostMs: 15_000,
  doublePpBatteryChancePerStack: 0.2,
} as const;

export type ModuleSpec = {
  readonly price: number;
  /** 同時に持てる数。使い切るものは、残っている数で数える */
  readonly maxStack: number;
  readonly consumable: boolean;
};

export const MODULES: Record<ModuleId, ModuleSpec> = {
  doublePpAndGrowth: { price: 6, maxStack: 2, consumable: false },
  revive: { price: 12, maxStack: 2, consumable: true },
  reviveAtOneHp: { price: 8, maxStack: 2, consumable: true },
  timeLimitPlus5s: { price: 4, maxStack: 6, consumable: false },
  timeLimitBoostNextStage: { price: 2, maxStack: 3, consumable: true },
  wallDamageImmunity: { price: 3, maxStack: 3, consumable: true },
  maxHpPlus1: { price: 7, maxStack: 3, consumable: false },
  doublePpBattery: { price: 5, maxStack: 3, consumable: false },
};
