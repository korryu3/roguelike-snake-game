export type Lang = "ja" | "en";

export const LANGS: readonly Lang[] = ["ja", "en"];

/** 切り替えのボタンには、どちらの言語で遊んでいても、その言語自身の書き方で名前を出す */
export const LANG_NAMES: Readonly<Record<Lang, string>> = { ja: "日本語", en: "English" };
