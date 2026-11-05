import type { Direction } from "../logic/types";

export type KeyCommand =
  | { readonly kind: "direction"; readonly direction: Direction }
  | { readonly kind: "restart" }
  | { readonly kind: "togglePanel" };

const move = (direction: Direction): KeyCommand => ({ kind: "direction", direction });

const KEY_COMMANDS: Readonly<Record<string, KeyCommand>> = {
  KeyW: move("up"),
  KeyA: move("left"),
  KeyS: move("down"),
  KeyD: move("right"),
  ArrowUp: move("up"),
  ArrowLeft: move("left"),
  ArrowDown: move("down"),
  ArrowRight: move("right"),
  KeyR: { kind: "restart" },
  KeyT: { kind: "togglePanel" },
};

/** `KeyboardEvent.code`を受け取る */
export function commandOfKey(code: string): KeyCommand | null {
  return KEY_COMMANDS[code] ?? null;
}

const TYPING_TAGS: ReadonlySet<string> = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** 入力欄に打っているキーは、ゲームの操作にしない */
export function isTypingTarget(element: Pick<HTMLElement, "tagName" | "isContentEditable">): boolean {
  return TYPING_TAGS.has(element.tagName) || element.isContentEditable;
}
