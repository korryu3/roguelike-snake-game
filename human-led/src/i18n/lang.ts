export type Lang = "ja" | "en";

export const LANGS: readonly Lang[] = ["ja", "en"];

/** 切り替えのボタンには、どちらの言語で遊んでいても、その言語自身の書き方で名前を出す */
export const LANG_NAMES: Readonly<Record<Lang, string>> = { ja: "日本語", en: "English" };

const KEY = "logsune.lang";

type KeyValue = Pick<Storage, "getItem" | "setItem">;

export type LangStorage = {
  readonly load: () => Lang;
  readonly save: (lang: Lang) => void;
};

const isLang = (value: string | null): value is Lang => LANGS.some((lang) => lang === value);

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
