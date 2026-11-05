import { CONFIG } from "../config";
import type { ModuleId } from "./types";

export type Effects = { readonly maxHp: number };

export function effectsOf(modules: readonly ModuleId[]): Effects {
  const count = (id: ModuleId) => modules.filter((m) => m === id).length;
  return { maxHp: CONFIG.initialHp + count("maxHpPlus1") };
}
