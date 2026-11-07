import { z } from "zod";
import { DEFAULT_VOLUMES, type Volumes, volumesSchema } from "../audio/volume";
import { LANGS, type Lang } from "../i18n/lang";

/** プレイヤーが設定メニューで選ぶもの。ゲームの数値（調整パネル）とは別に保存する */
export type Preferences = { readonly lang: Lang; readonly volumes: Volumes };

export const DEFAULT_PREFERENCES: Preferences = { lang: "ja", volumes: DEFAULT_VOLUMES };

const KEY = "logsune.preferences";

/** 書き込むのはこのアプリだけで、人が直す機会がないので、使えない値はその項目だけ既定にする */
const preferencesSchema = z
  .object({ lang: z.enum(LANGS).catch(DEFAULT_PREFERENCES.lang), volumes: volumesSchema })
  .catch(DEFAULT_PREFERENCES);

type KeyValue = Pick<Storage, "getItem" | "setItem">;

export type PreferencesStorage = {
  readonly load: () => Preferences;
  readonly save: (preferences: Preferences) => void;
};

/** localStorageは取り出すだけで例外が出る環境もあるので、取り出し方ごと受け取る */
export function createPreferencesStorage(getStorage: () => KeyValue): PreferencesStorage {
  return {
    load: () => {
      try {
        const saved: unknown = JSON.parse(getStorage().getItem(KEY) ?? "{}");
        return preferencesSchema.parse(saved);
      } catch {
        return DEFAULT_PREFERENCES;
      }
    },
    save: (preferences) => {
      try {
        getStorage().setItem(KEY, JSON.stringify(preferences));
      } catch {
        // 保存できなくても、その回は選んだ設定で遊べる
      }
    },
  };
}
