const KEY = "logsune.muted";

type KeyValue = Pick<Storage, "getItem" | "setItem">;

export type MuteStorage = {
  readonly load: () => boolean;
  readonly save: (muted: boolean) => void;
};

/** localStorageは取り出すだけで例外が出る環境もあるので、取り出し方ごと受け取る */
export function createMuteStorage(getStorage: () => KeyValue): MuteStorage {
  return {
    load: () => {
      try {
        return getStorage().getItem(KEY) === "true";
      } catch {
        return false;
      }
    },
    save: (muted) => {
      try {
        getStorage().setItem(KEY, String(muted));
      } catch {
        // 保存できなくても、その回は選んだとおりに鳴らす
      }
    },
  };
}
