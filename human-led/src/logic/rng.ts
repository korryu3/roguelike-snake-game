import type { RngState } from "./types";

/** mulberry32。[0, 1)の値と、次の状態を返す */
export function nextFloat(state: RngState): [number, RngState] {
  const next = (state + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

export function pick<T>(state: RngState, items: readonly T[]): [T, RngState] {
  const [r, next] = nextFloat(state);
  const item = items[Math.floor(r * items.length)];
  if (item === undefined) throw new Error("空の配列からは選べない");
  return [item, next];
}

/** 重ならないようにcount個選ぶ。足りなければ、あるだけ返す */
export function pickDistinct<T>(state: RngState, items: readonly T[], count: number): [T[], RngState] {
  if (count <= 0 || items.length === 0) return [[], state];
  const [item, next] = pick(state, items);
  const [rest, last] = pickDistinct(
    next,
    items.filter((i) => i !== item),
    count - 1,
  );
  return [[item, ...rest], last];
}
