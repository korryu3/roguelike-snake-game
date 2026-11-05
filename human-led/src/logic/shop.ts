import { CONFIG, MODULES } from "../config";
import { pickDistinct } from "./rng";
import type { Game, ModuleId, StepResult } from "./types";

const ALL_MODULES = Object.keys(MODULES) as ModuleId[];

export function openShop(game: Game): StepResult {
  if (game.phase !== "cleared") return { game, events: [] };
  const owned = game.run.modules;
  const buyable = ALL_MODULES.filter((id) => owned.filter((m) => m === id).length < MODULES[id].maxStack);
  const [modules, rng] = pickDistinct(game.run.rng, buyable, CONFIG.shopOfferCount);
  const offers = modules.map((module) => ({ module, sold: false }));
  return { game: { phase: "shop", run: { ...game.run, rng }, offers }, events: [] };
}
