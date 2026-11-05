import { CONFIG, MODULES } from "../config";
import { effectsOf } from "./modules";
import { pickDistinct } from "./rng";
import type { Game, ModuleId, Offer, RunState, StepResult } from "./types";

const ALL_MODULES = Object.keys(MODULES) as ModuleId[];

function drawOffers(run: RunState): [Offer[], RunState] {
  const buyable = ALL_MODULES.filter((id) => run.modules.filter((m) => m === id).length < MODULES[id].maxStack);
  const [modules, rng] = pickDistinct(run.rng, buyable, CONFIG.shopOfferCount);
  return [modules.map((module) => ({ module, sold: false })), { ...run, rng }];
}

export function openShop(game: Game): StepResult {
  if (game.phase !== "cleared") return { game, events: [] };
  const [offers, run] = drawOffers(game.run);
  return { game: { phase: "shop", run, offers }, events: [] };
}

export function buyModule(game: Game, offerIndex: number): StepResult {
  const unchanged = { game, events: [] };
  if (game.phase !== "shop") return unchanged;
  const offer = game.offers[offerIndex];
  const { run } = game;
  if (offer === undefined || offer.sold || run.pp < MODULES[offer.module].price) return unchanged;
  const modules = [...run.modules, offer.module];
  const bought = {
    ...run,
    hp: run.hp + effectsOf(modules).maxHp - effectsOf(run.modules).maxHp,
    pp: run.pp - MODULES[offer.module].price,
    modules,
    purchased: [...run.purchased, offer.module],
  };
  const offers = game.offers.map((o, i) => (i === offerIndex ? { ...o, sold: true } : o));
  const [nextOffers, nextRun] = offers.every((o) => o.sold) ? drawOffers(bought) : [offers, bought];
  return { game: { ...game, run: nextRun, offers: nextOffers }, events: [] };
}
