import type { Messages } from "../i18n/messages";
import { effectsOf, REVIVE_HP } from "../logic/modules";
import type { Game, ModuleId, RunState } from "../logic/types";

type ShopGame = Extract<Game, { phase: "shop" }>;

export type OfferView = {
  readonly offerIndex: number;
  readonly module: ModuleId;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly sold: boolean;
  readonly affordable: boolean;
};

export function describeOffers(game: ShopGame, t: Messages): OfferView[] {
  const { tuning } = game.run;
  return game.offers.map((offer, offerIndex) => {
    const { price } = tuning.modules[offer.module];
    return {
      offerIndex,
      module: offer.module,
      name: t.modules[offer.module].name,
      description: t.modules[offer.module].description(tuning.config),
      price,
      sold: offer.sold,
      affordable: !offer.sold && game.run.pp >= price,
    };
  });
}

export type ModuleLine = { readonly module: ModuleId; readonly name: string; readonly count: number };

export function describeModules(modules: readonly ModuleId[], t: Messages): ModuleLine[] {
  const counts = new Map<ModuleId, number>();
  for (const module of modules) counts.set(module, (counts.get(module) ?? 0) + 1);
  return [...counts].map(([module, count]) => ({ module, name: t.modules[module].name, count }));
}

export type ReviveOption = ModuleLine & { readonly hp: number; readonly maxHp: number };

export function reviveOptions(run: RunState, t: Messages): ReviveOption[] {
  const { maxHp } = effectsOf(run.modules, run.tuning.config);
  return describeModules(run.modules, t).flatMap((line) => {
    const reviveHp = REVIVE_HP[line.module];
    return reviveHp ? [{ ...line, hp: reviveHp(maxHp), maxHp }] : [];
  });
}
