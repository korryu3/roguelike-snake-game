import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Messages } from "../i18n/messages";
import type { Game } from "../logic/types";
import type { ScreenAction } from "../loop/session";
import { formatRemainingTime } from "./format";
import { GameDialog } from "./GameDialog";
import { Stat, Stats } from "./Stats";
import { describeOffers, reviveOptions } from "./view";

type Perform = (action: ScreenAction) => void;

type Props<P extends Game["phase"]> = { game: Extract<Game, { phase: P }>; t: Messages; perform: Perform };

const Actions = ({ children }: { children: ReactNode }) => <div className="flex justify-center gap-3">{children}</div>;

export function ClearModal({ game, t, perform }: Props<"cleared">) {
  const { summary } = game;
  return (
    <GameDialog title={t.cleared.title(summary.stageNumber)}>
      <Stats>
        <Stat label={t.cleared.ppEarned}>{summary.ppEarned}</Stat>
        <Stat label={t.cleared.score}>{summary.batteryScore + summary.timeBonus}</Stat>
        <Stat label={t.cleared.batteryScore} sub>
          {summary.batteryScore}
        </Stat>
        <Stat label={t.cleared.timeBonus} sub>
          {summary.timeBonus}
        </Stat>
        <Stat label={t.cleared.elapsed}>{formatRemainingTime(summary.elapsedMs)}</Stat>
      </Stats>
      <Actions>
        <Button size="game" autoFocus onClick={() => perform({ kind: "openShop" })}>
          {t.cleared.toShop}
        </Button>
      </Actions>
    </GameDialog>
  );
}

export function ShopModal({ game, t, perform }: Props<"shop">) {
  const { rerollPrice } = game.run.tuning.config;
  return (
    <GameDialog title={t.shop.title}>
      <p className="m-0 text-lg font-bold">{t.shop.pp(game.run.pp)}</p>
      <ul className="m-0 grid w-full list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 p-0">
        {describeOffers(game, t).map((offer) => (
          <li
            key={offer.offerIndex}
            className={cn("flex flex-col gap-2 rounded-xl border bg-board-floor p-3.5", offer.sold && "opacity-50")}
          >
            <h3 className="m-0 text-[17px]">{offer.name}</h3>
            <p className="m-0 flex-1 text-sm text-foreground/80">{offer.description}</p>
            <p className="m-0 font-bold text-gold">{t.shop.price(offer.price)}</p>
            <Button
              variant="secondary"
              size="game"
              disabled={!offer.affordable}
              onClick={() => perform({ kind: "buy", offerIndex: offer.offerIndex })}
            >
              {offer.sold ? t.shop.sold : offer.affordable ? t.shop.buy : t.shop.notEnoughPp}
            </Button>
          </li>
        ))}
      </ul>
      <Actions>
        <Button
          variant="secondary"
          size="game"
          disabled={game.run.pp < rerollPrice}
          onClick={() => perform({ kind: "reroll" })}
        >
          {t.shop.reroll(rerollPrice)}
        </Button>
        <Button size="game" autoFocus onClick={() => perform({ kind: "nextStage" })}>
          {t.shop.nextStage}
        </Button>
      </Actions>
    </GameDialog>
  );
}

export function ReviveModal({ game, t, perform }: Props<"reviveChoice">) {
  return (
    <GameDialog title={t.revive.title}>
      <p className="m-0">{t.revive.prompt}</p>
      <ul className="m-0 flex w-[min(420px,100%)] list-none flex-col gap-2 p-0">
        {reviveOptions(game.run, t).map((option) => (
          <li key={option.module}>
            <Button
              variant="secondary"
              size="game"
              className="w-full justify-between"
              data-silent
              onClick={() => perform({ kind: "revive", module: option.module })}
            >
              <span>
                {option.name}
                <span className="ml-1 text-gold tabular-nums">{t.count(option.count)}</span>
              </span>
              <span className="font-bold text-success">{t.revive.restoresTo(option.hp, option.maxHp)}</span>
            </Button>
          </li>
        ))}
      </ul>
      <Actions>
        <Button variant="secondary" size="game" onClick={() => perform({ kind: "giveUp" })}>
          {t.revive.giveUp}
        </Button>
      </Actions>
    </GameDialog>
  );
}
