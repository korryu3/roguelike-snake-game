import { z } from "zod";
import { DEFAULT_TUNING, MODULE_IDS, type Tuning } from "../config";
import { recordOf } from "../lib/records";
import type { WallPattern } from "../logic/types";
import { checkWallPattern } from "../logic/wallPatterns";
import { CONFIG_FIELDS, CONFIG_KEYS, MODULE_SPEC_FIELDS, type Rule, SPEC_KEYS } from "./fields";

/** 読み込めなかった理由。pathはJSONの中の位置（`config.boardSize`、`wallPatterns.2`）で、一番外は"" */
export type TuningIssue = { readonly path: string; readonly kind: "unknown" | "invalid" };

/** 書かれていない項目は既定値で埋める。使えない値か知らない項目が1つでもあれば、全体を読み込まない */
export type ParseResult =
  | { readonly ok: true; readonly tuning: Tuning }
  | { readonly ok: false; readonly reason: "notJson" }
  | { readonly ok: false; readonly reason: "invalid"; readonly issues: readonly TuningIssue[] };

const numberOf = (rule: Rule) => {
  const ranged = z.number().min(rule.min).max(rule.max);
  return rule.integer ? ranged.int() : ranged;
};

/** 調整パネルの入力欄も、同じ決まりで検査する */
export const satisfies = (rule: Rule, value: unknown): value is number => numberOf(rule).safeParse(value).success;

const isPattern = (value: unknown): value is WallPattern =>
  Array.isArray(value) && value.every((row) => typeof row === "string") && checkWallPattern(value) === null;

const tuningSchema = z.strictObject({
  config: z
    .strictObject(recordOf(CONFIG_KEYS, (key) => numberOf(CONFIG_FIELDS[key].rule).default(DEFAULT_TUNING.config[key])))
    .default(DEFAULT_TUNING.config),
  modules: z
    .strictObject(
      recordOf(MODULE_IDS, (id) =>
        z
          .strictObject(
            recordOf(SPEC_KEYS, (key) =>
              numberOf(MODULE_SPEC_FIELDS[key].rule).default(DEFAULT_TUNING.modules[id][key]),
            ),
          )
          .default(DEFAULT_TUNING.modules[id]),
      ),
    )
    .default(DEFAULT_TUNING.modules),
  wallPatterns: z
    .array(z.custom<WallPattern>(isPattern))
    .min(1)
    .default(() => [...DEFAULT_TUNING.wallPatterns]),
});

const pathOf = (path: readonly PropertyKey[]) => path.map(String).join(".");

/** zodの問題を、JSONの中の位置ごとの問題にする。知らない項目は、項目ごとに分ける */
function issuesOf(error: z.ZodError): TuningIssue[] {
  const issues = error.issues.flatMap((issue): TuningIssue[] =>
    issue.code === "unrecognized_keys"
      ? issue.keys.map((key) => ({ path: pathOf([...issue.path, key]), kind: "unknown" }))
      : [{ path: pathOf(issue.path), kind: "invalid" }],
  );
  // 1つの値が、いくつもの決まりに引っかかることがある
  return issues.filter((a, i) => issues.findIndex((b) => b.path === a.path && b.kind === a.kind) === i);
}

/** 外から来た文字列を、既定値の形に合わせて検査する */
export function parseTuningJson(text: string): ParseResult {
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return { ok: false, reason: "notJson" };
  }
  const result = tuningSchema.safeParse(input);
  return result.success
    ? { ok: true, tuning: result.data }
    : { ok: false, reason: "invalid", issues: issuesOf(result.error) };
}
