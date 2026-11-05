import type { Config, ModuleSpec } from "../config";
import type { ModuleId } from "../logic/types";

export type Rule = { readonly min: number; readonly max: number; readonly integer: boolean };

const count = (min: number, max = Number.MAX_SAFE_INTEGER): Rule => ({ min, max, integer: true });
const PROBABILITY: Rule = { min: 0, max: 1, integer: false };

export type ConfigField = { readonly label: string; readonly group: string; readonly rule: Rule };

/** 盤面の大きさの上限は、Canvasが画面に収まる程度に抑える */
export const CONFIG_FIELDS: Readonly<Record<keyof Config, ConfigField>> = {
  boardSize: { label: "盤面の大きさ（マス）", group: "盤面とスネーク", rule: count(5, 40) },
  moveIntervalMs: { label: "移動の間隔（ms）", group: "盤面とスネーク", rule: count(1) },
  initialLength: { label: "最初の長さ", group: "盤面とスネーク", rule: count(1) },
  inputQueueLimit: { label: "溜められる入力の数", group: "盤面とスネーク", rule: count(1) },
  initialHp: { label: "最初のHP", group: "HPとぶつかったとき", rule: count(1) },
  stunMs: { label: "止まる時間（ms）", group: "HPとぶつかったとき", rule: count(0) },
  invincibleMs: { label: "無敵時間（ms）", group: "HPとぶつかったとき", rule: count(0) },
  timeLimitMs: { label: "制限時間（ms）", group: "ステージ", rule: count(1) },
  batteriesToGoal: { label: "ゴールまでのバッテリー", group: "ステージ", rule: count(1) },
  ppPerBattery: { label: "バッテリー1個のPP", group: "ステージ", rule: count(0) },
  heartEveryTotalPp: { label: "ハートが出る累計PPの間隔", group: "ステージ", rule: count(1) },
  heartWithBatteryChance: { label: "食べたときにハートが出る確率", group: "ステージ", rule: PROBABILITY },
  scorePerBattery: { label: "バッテリー1個のスコア", group: "スコア", rule: count(0) },
  timeBonusPerSecond: { label: "残り1秒の時間ボーナス", group: "スコア", rule: count(0) },
  shopOfferCount: { label: "候補の数", group: "モジュールの画面", rule: count(0) },
  rerollPrice: { label: "リロールの値段", group: "モジュールの画面", rule: count(0) },
  timeLimitPlusMs: { label: "制限時間＋の延長（ms）", group: "モジュールの効果", rule: count(0) },
  timeLimitBoostMs: { label: "一時延長の延長（ms）", group: "モジュールの効果", rule: count(0) },
  doublePpBatteryChancePerStack: { label: "PP2倍のバッテリーの確率（1個あたり）", group: "モジュールの効果", rule: PROBABILITY },
};

export const MODULE_SPEC_FIELDS: Readonly<Record<keyof ModuleSpec, { readonly label: string; readonly rule: Rule }>> = {
  price: { label: "値段", rule: count(0) },
  maxStack: { label: "上限", rule: count(0) },
};

export const MODULE_LABELS: Readonly<Record<ModuleId, string>> = {
  doublePpAndGrowth: "PP・伸び2倍",
  revive: "1回生き返る",
  reviveAtOneHp: "1回生き返る（デメリット付き）",
  timeLimitPlus5s: "制限時間＋5秒",
  timeLimitBoostNextStage: "制限時間の一時延長",
  wallDamageImmunity: "壁ダメージ無効",
  maxHpPlus1: "HPの上限＋1",
  doublePpBattery: "PP2倍のバッテリー",
};
