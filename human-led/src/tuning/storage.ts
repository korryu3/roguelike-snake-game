import { DEFAULT_TUNING, MODULE_IDS, type Tuning } from "../config";
import { CONFIG_KEYS, SPEC_KEYS } from "./fields";
import { parseTuningJson } from "./parse";

const KEY = "logsune.tuning";

type KeyValue = Pick<Storage, "getItem" | "setItem">;

export type TuningStorage = {
  readonly load: () => Tuning;
  /** 保存できたかどうか */
  readonly save: (tuning: Tuning) => boolean;
};

/** localStorageは取り出すだけで例外が出る環境もあるので、取り出し方ごと受け取る */
export function createTuningStorage(getStorage: () => KeyValue): TuningStorage {
  return {
    load: () => {
      let text: string | null;
      try {
        text = getStorage().getItem(KEY);
      } catch {
        return DEFAULT_TUNING;
      }
      const result = parseTuningJson(text ?? "");
      return result.ok ? result.tuning : DEFAULT_TUNING;
    },
    save: (tuning) => {
      try {
        getStorage().setItem(KEY, JSON.stringify(changedFromDefaults(tuning)));
        return true;
      } catch {
        return false;
      }
    },
  };
}

const entriesOf = <K extends string, V>(keys: readonly K[], valueOf: (key: K) => V | undefined) =>
  Object.fromEntries(
    keys.flatMap((key) => {
      const value = valueOf(key);
      return value === undefined ? [] : [[key, value]];
    }),
  );

const nonEmpty = (record: Readonly<Record<string, unknown>>) => (Object.keys(record).length > 0 ? record : undefined);

/**
 * 既定値から変えた項目だけを残す。変えていない項目は、読むときのその時点の既定値になるので、
 * 既定値を変えて公開すれば、前に遊んだブラウザにも届く。壁のパターンは、1つでも違えば一覧ごと残す
 */
function changedFromDefaults(tuning: Tuning): Readonly<Record<string, unknown>> {
  const config = nonEmpty(
    entriesOf(CONFIG_KEYS, (key) =>
      tuning.config[key] === DEFAULT_TUNING.config[key] ? undefined : tuning.config[key],
    ),
  );
  const modules = nonEmpty(
    entriesOf(MODULE_IDS, (id) =>
      nonEmpty(
        entriesOf(SPEC_KEYS, (key) =>
          tuning.modules[id][key] === DEFAULT_TUNING.modules[id][key] ? undefined : tuning.modules[id][key],
        ),
      ),
    ),
  );
  const wallPatterns =
    JSON.stringify(tuning.wallPatterns) === JSON.stringify(DEFAULT_TUNING.wallPatterns)
      ? undefined
      : tuning.wallPatterns;
  return Object.fromEntries(
    Object.entries({ config, modules, wallPatterns }).filter(([, value]) => value !== undefined),
  );
}
