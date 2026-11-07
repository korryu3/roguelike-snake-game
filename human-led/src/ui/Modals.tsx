import type { ReactNode } from "react";
import type { Messages } from "../i18n/messages";
import type { Game } from "../logic/types";
import type { ScreenAction } from "../loop/session";
import { formatRemainingTime } from "./format";
import { describeOffers, reviveOptions } from "./view";

type Perform = (action: ScreenAction) => void;

type Props<P extends Game["phase"]> = { game: Extract<Game, { phase: P }>; t: Messages; perform: Perform };

function Modal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2 className="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}

export function ClearModal({ game, t, perform }: Props<"cleared">) {
  const { summary } = game;
  return (
    <Modal title={t.cleared.title(summary.stageNumber)}>
      <dl className="stats">
        <dt>{t.cleared.ppEarned}</dt>
        <dd>{summary.ppEarned}</dd>
        <dt>{t.cleared.score}</dt>
        <dd>{summary.batteryScore + summary.timeBonus}</dd>
        <dt className="stats-sub">{t.cleared.batteryScore}</dt>
        <dd className="stats-sub">{summary.batteryScore}</dd>
        <dt className="stats-sub">{t.cleared.timeBonus}</dt>
        <dd className="stats-sub">{summary.timeBonus}</dd>
        <dt>{t.cleared.elapsed}</dt>
        <dd>{formatRemainingTime(summary.elapsedMs)}</dd>
      </dl>
      <div className="modal-actions">
        <button type="button" className="button button-primary" autoFocus onClick={() => perform({ kind: "openShop" })}>
          {t.cleared.toShop}
        </button>
      </div>
    </Modal>
  );
}

export function ShopModal({ game, t, perform }: Props<"shop">) {
  const { rerollPrice } = game.run.tuning.config;
  return (
    <Modal title={t.shop.title}>
      <p className="shop-pp">{t.shop.pp(game.run.pp)}</p>
      <ul className="offers">
        {describeOffers(game, t).map((offer) => (
          <li key={offer.offerIndex} className={offer.sold ? "offer offer-sold" : "offer"}>
            <h3 className="offer-name">{offer.name}</h3>
            <p className="offer-description">{offer.description}</p>
            <p className="offer-price">{t.shop.price(offer.price)}</p>
            <button
              type="button"
              className="button"
              disabled={!offer.affordable}
              onClick={() => perform({ kind: "buy", offerIndex: offer.offerIndex })}
            >
              {offer.sold ? t.shop.sold : offer.affordable ? t.shop.buy : t.shop.notEnoughPp}
            </button>
          </li>
        ))}
      </ul>
      <div className="modal-actions">
        <button type="button" className="button" disabled={game.run.pp < rerollPrice} onClick={() => perform({ kind: "reroll" })}>
          {t.shop.reroll(rerollPrice)}
        </button>
        <button type="button" className="button button-primary" autoFocus onClick={() => perform({ kind: "nextStage" })}>
          {t.shop.nextStage}
        </button>
      </div>
    </Modal>
  );
}

export function ReviveModal({ game, t, perform }: Props<"reviveChoice">) {
  return (
    <Modal title={t.revive.title}>
      <p>{t.revive.prompt}</p>
      <ul className="revive-options">
        {reviveOptions(game.run, t).map((option) => (
          <li key={option.module}>
            <button type="button" className="button revive-option" data-silent onClick={() => perform({ kind: "revive", module: option.module })}>
              <span className="revive-name">
                {option.name}
                <span className="chip-count">{t.count(option.count)}</span>
              </span>
              <span className="revive-hp">{t.revive.restoresTo(option.hp, option.maxHp)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="modal-actions">
        <button type="button" className="button" onClick={() => perform({ kind: "giveUp" })}>
          {t.revive.giveUp}
        </button>
      </div>
    </Modal>
  );
}
