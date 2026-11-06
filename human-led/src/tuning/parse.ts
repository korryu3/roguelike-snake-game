import { DEFAULT_TUNING, MODULE_IDS, type Config, type ModuleSpec, type Tuning } from "../config";
import type { ModuleId, WallPattern } from "../logic/types";
import { checkWallPattern } from "../logic/wallPatterns";
import { CONFIG_FIELDS, CONFIG_KEYS, MODULE_SPEC_FIELDS, type Rule, SPEC_KEYS } from "./fields";

/** unknownは知らない項目で捨てた、invalidは使えない値で既定値に戻した */
export type TuningIssue = { readonly path: string; readonly kind: "unknown" | "invalid" };

export type ParseResult =
  | { readonly ok: true; readonly tuning: Tuning; readonly issues: readonly TuningIssue[] }
  | { readonly ok: false; readonly reason: "notJson" | "notObject" };

type Json = Readonly<Record<string, unknown>>;

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);

export const satisfies = (rule: Rule, value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= rule.min &&
  value <= rule.max &&
  (!rule.integer || Number.isInteger(value));

/** 外から来た文字列を、既定値の形に合わせて検査する。足りない項目は既定値で埋める */
export function parseTuningJson(text: string): ParseResult {
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return { ok: false, reason: "notJson" };
  }
  if (!isObject(input)) return { ok: false, reason: "notObject" };
  const issues: TuningIssue[] = [];
  const join = (prefix: string, key: string) => (prefix ? `${prefix}.${key}` : key);

  const section = (path: string, given: unknown, known: readonly string[]): Json => {
    if (given === undefined) return {};
    if (!isObject(given)) {
      issues.push({ path, kind: "invalid" });
      return {};
    }
    for (const key of Object.keys(given)) if (!known.includes(key)) issues.push({ path: join(path, key), kind: "unknown" });
    return given;
  };
  const value = (path: string, rule: Rule, given: unknown, fallback: number): number => {
    if (given === undefined) return fallback;
    if (satisfies(rule, given)) return given;
    issues.push({ path, kind: "invalid" });
    return fallback;
  };

  const root = section("", input, ["config", "modules", "wallPatterns"]);
  const config = section("config", root.config, CONFIG_KEYS);
  const modules = section("modules", root.modules, MODULE_IDS);
  const specOf = (id: ModuleId): ModuleSpec => {
    const given = section(`modules.${id}`, modules[id], SPEC_KEYS);
    const fallback = DEFAULT_TUNING.modules[id];
    return Object.fromEntries(
      SPEC_KEYS.map((key) => [key, value(`modules.${id}.${key}`, MODULE_SPEC_FIELDS[key].rule, given[key], fallback[key])]),
    ) as ModuleSpec;
  };
  const tuning: Tuning = {
    config: Object.fromEntries(
      CONFIG_KEYS.map((key) => [key, value(`config.${key}`, CONFIG_FIELDS[key].rule, config[key], DEFAULT_TUNING.config[key])]),
    ) as Config,
    modules: Object.fromEntries(MODULE_IDS.map((id) => [id, specOf(id)])) as Tuning["modules"],
    wallPatterns: wallPatternsOf(root.wallPatterns, issues),
  };
  return { ok: true, tuning, issues };
}

const isPattern = (value: unknown): value is WallPattern =>
  Array.isArray(value) && value.every((row) => typeof row === "string") && checkWallPattern(value) === null;

/** 使えないパターンは捨てる。1つも残らなければ既定のパターンにする */
function wallPatternsOf(given: unknown, issues: TuningIssue[]): readonly WallPattern[] {
  if (given === undefined) return DEFAULT_TUNING.wallPatterns;
  const fallback = () => {
    issues.push({ path: "wallPatterns", kind: "invalid" });
    return DEFAULT_TUNING.wallPatterns;
  };
  if (!Array.isArray(given)) return fallback();
  const usable = given.filter((pattern, i) => {
    if (isPattern(pattern)) return true;
    issues.push({ path: `wallPatterns.${i}`, kind: "invalid" });
    return false;
  });
  return usable.length > 0 ? usable : fallback();
}
