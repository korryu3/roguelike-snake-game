import { DEFAULT_TUNING, type Tuning } from "../config";
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
        getStorage().setItem(KEY, JSON.stringify(tuning));
        return true;
      } catch {
        return false;
      }
    },
  };
}
