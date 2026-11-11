import { MODULE_IDS } from "../config";
import { effectsOf } from "./modules";
import { nextFloat, pickDistinct } from "./rng";
import type { Game, Offer, RunState, StepResult } from "./types";

function drawOffers(run: RunState): [Offer[], RunState] {
  const { modules: specs } = run.tuning;
  const buyable = MODULE_IDS.filter((id) => run.modules.filter((m) => m === id).length < specs[id].maxStack);
  const [count, rngAfterRoll] = offerCount(run);
  const [modules, rng] = pickDistinct(rngAfterRoll, buyable, count);
  return [modules.map((module) => ({ module, sold: false })), { ...run, rng }];
}

/** モジュール候補＋1を持っていなければ乱数を使わない。持っていないランの候補の出方を変えないため */
function offerCount(run: RunState): [number, RunState["rng"]] {
  const { config } = run.tuning;
  const chance = effectsOf(run.modules, config).extraModuleChoiceChance;
  if (chance <= 0) return [config.shopOfferCount, run.rng];
  const [roll, rng] = nextFloat(run.rng);
  return [config.shopOfferCount + (roll < chance ? 1 : 0), rng];
}

export function openShop(game: Game): StepResult {
  if (game.phase !== "cleared") return { game, events: [] };
  const [offers, run] = drawOffers(game.run);
  return { game: { phase: "shop", run, offers }, events: [] };
}

export function reroll(game: Game): StepResult {
  if (game.phase !== "shop") return { game, events: [] };
  const { rerollPrice } = game.run.tuning.config;
  if (game.run.pp < rerollPrice) return { game, events: [] };
  const [offers, run] = drawOffers({ ...game.run, pp: game.run.pp - rerollPrice });
  return { game: { ...game, run, offers }, events: [] };
}

export function buyModule(game: Game, offerIndex: number): StepResult {
  const unchanged = { game, events: [] };
  if (game.phase !== "shop") return unchanged;
  const offer = game.offers[offerIndex];
  const { run } = game;
  if (offer === undefined || offer.sold) return unchanged;
  const { price } = run.tuning.modules[offer.module];
  if (run.pp < price) return unchanged;
  const modules = [...run.modules, offer.module];
  const bought = {
    ...run,
    hp: run.hp + effectsOf(modules, run.tuning.config).maxHp - effectsOf(run.modules, run.tuning.config).maxHp,
    pp: run.pp - price,
    modules,
    purchased: [...run.purchased, offer.module],
  };
  const offers = game.offers.map((o, i) => (i === offerIndex ? { ...o, sold: true } : o));
  const [nextOffers, nextRun] = offers.every((o) => o.sold) ? drawOffers(bought) : [offers, bought];
  return { game: { ...game, run: nextRun, offers: nextOffers }, events: [] };
}
