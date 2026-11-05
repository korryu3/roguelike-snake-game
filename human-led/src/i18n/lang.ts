export type Lang = "ja" | "en";

const KEY = "logsune.lang";

type KeyValue = Pick<Storage, "getItem" | "setItem">;

export type LangStorage = {
  readonly load: () => Lang;
  readonly save: (lang: Lang) => void;
};

const isLang = (value: string | null): value is Lang => value === "ja" || value === "en";

/** localStorageは取り出すだけで例外が出る環境もあるので、取り出し方ごと受け取る */
export function createLangStorage(getStorage: () => KeyValue): LangStorage {
  return {
    load: () => {
      try {
        const value = getStorage().getItem(KEY);
        return isLang(value) ? value : "ja";
      } catch {
        return "ja";
      }
    },
    save: (lang) => {
      try {
        getStorage().setItem(KEY, lang);
      } catch {
        // 保存できなくても、その回は選んだ言語で遊べる
      }
    },
  };
}
