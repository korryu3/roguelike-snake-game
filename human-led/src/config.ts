import type { ModuleId } from "./logic/types";

export const CONFIG = {
  boardSize: 15,
  moveIntervalMs: 150,
  timeLimitMs: 60_000,
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
  heartEveryTotalPp: 10,
  heartWithBatteryChance: 0.03,
} as const;

export type Config = { readonly [K in keyof typeof CONFIG]: number };

export type ModuleSpec = {
  readonly price: number;
  /** 同時に持てる数。使い切るものは、残っている数で数える */
  readonly maxStack: number;
};

/** ランを始めるときに決め、ランのあいだはランの状態が持つ数値 */
export type Tuning = {
  readonly config: Config;
  readonly modules: Readonly<Record<ModuleId, ModuleSpec>>;
};

export const MODULES: Record<ModuleId, ModuleSpec> = {
  doublePpAndGrowth: { price: 6, maxStack: 2 },
  revive: { price: 12, maxStack: 2 },
  reviveAtOneHp: { price: 8, maxStack: 2 },
  timeLimitPlus5s: { price: 4, maxStack: 6 },
  timeLimitBoostNextStage: { price: 2, maxStack: 3 },
  wallDamageImmunity: { price: 3, maxStack: 3 },
  maxHpPlus1: { price: 7, maxStack: 3 },
  doublePpBattery: { price: 5, maxStack: 3 },
};

export const MODULE_IDS = Object.keys(MODULES) as readonly ModuleId[];

export const DEFAULT_TUNING: Tuning = { config: CONFIG, modules: MODULES };
