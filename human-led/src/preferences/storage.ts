import { DEFAULT_VOLUMES, parseVolumes, type Volumes } from "../audio/volume";
import { LANGS, type Lang } from "../i18n/lang";

/** プレイヤーが設定メニューで選ぶもの。ゲームの数値（調整パネル）とは別に保存する */
export type Preferences = { readonly lang: Lang; readonly volumes: Volumes };

export const DEFAULT_PREFERENCES: Preferences = { lang: "ja", volumes: DEFAULT_VOLUMES };

const KEY = "logsune.preferences";

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
        const given = isRecord(saved) ? saved : {};
        const lang = LANGS.find((l) => l === given.lang) ?? DEFAULT_PREFERENCES.lang;
        return { lang, volumes: parseVolumes(given.volumes) };
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

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
