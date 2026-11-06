import type { WallPattern } from "../logic/types";

/** 入力欄の文字を行に分ける。行の前後の空白と空行は捨てる */
export function patternFromText(text: string): WallPattern {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

export function patternToText(pattern: WallPattern): string {
  return pattern.join("\n");
}
