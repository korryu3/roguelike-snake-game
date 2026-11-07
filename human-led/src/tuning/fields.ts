import { type Config, DEFAULT_TUNING, MODULE_IDS, type ModuleSpec } from "../config";
import { MESSAGES } from "../i18n/messages";
import { keysOf } from "../lib/records";

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
  timeBonusPerSecond: { label: "残り1秒のタイムボーナス", group: "スコア", rule: count(0) },
  shopOfferCount: { label: "候補の数", group: "モジュールの画面", rule: count(0) },
  rerollPrice: { label: "リロールの値段", group: "モジュールの画面", rule: count(0) },
  timeLimitPlusMs: { label: "制限時間延長（永続）の秒数（ms）", group: "モジュールの効果", rule: count(0) },
  timeLimitBoostMs: { label: "制限時間延長（次のステージ）の秒数（ms）", group: "モジュールの効果", rule: count(0) },
  doublePpBatteryChancePerStack: {
    label: "PP2倍のバッテリーの確率（1個あたり）",
    group: "モジュールの効果",
    rule: PROBABILITY,
  },
};

export const MODULE_SPEC_FIELDS: Readonly<Record<keyof ModuleSpec, { readonly label: string; readonly rule: Rule }>> = {
  price: { label: "値段", rule: count(0) },
  maxStack: { label: "上限", rule: count(0) },
};

export const CONFIG_KEYS: readonly (keyof Config)[] = keysOf(DEFAULT_TUNING.config);
export const SPEC_KEYS: readonly (keyof ModuleSpec)[] = keysOf(MODULE_SPEC_FIELDS);

/** JSONの中の位置（`config.moveIntervalMs`、`modules.revive.price`）から、項目の名前と決まりを引く */
type Field = { readonly label: string; readonly rule: Rule };

export const FIELD_BY_PATH: ReadonlyMap<string, Field> = new Map<string, Field>([
  ...CONFIG_KEYS.map((key): [string, Field] => [`config.${key}`, CONFIG_FIELDS[key]]),
  ...MODULE_IDS.flatMap((id) =>
    SPEC_KEYS.map((key): [string, Field] => [
      `modules.${id}.${key}`,
      {
        label: `${MESSAGES.ja.modules[id].name}の${MODULE_SPEC_FIELDS[key].label}`,
        rule: MODULE_SPEC_FIELDS[key].rule,
      },
    ]),
  ),
]);
