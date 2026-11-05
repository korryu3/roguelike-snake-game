import { LANG_NAMES, LANGS, type Lang } from "../i18n/lang";
import type { Messages } from "../i18n/messages";
import type { Game } from "../logic/types";
import { ModuleChips } from "./Hud";
import { describeModules } from "./view";

type TitleProps = {
  readonly t: Messages;
  readonly lang: Lang;
  readonly onLangChange: (lang: Lang) => void;
  readonly onStart: () => void;
};

export function TitleScreen({ t, lang, onLangChange, onStart }: TitleProps) {
  return (
    <section className="screen title-screen">
      <h1 className="game-title">{t.title}</h1>
      <button type="button" className="button button-primary button-large" autoFocus onClick={onStart}>
        {t.startGame}
      </button>
      <div className="lang-switch" role="group" aria-label={t.language}>
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            className={l === lang ? "button lang-current" : "button"}
            aria-pressed={l === lang}
            onClick={() => onLangChange(l)}
          >
            {LANG_NAMES[l]}
          </button>
        ))}
      </div>
    </section>
  );
}

type GameOverProps = {
  readonly game: Extract<Game, { phase: "gameOver" }>;
  readonly t: Messages;
  readonly onRetry: () => void;
  readonly onTitle: () => void;
};

export function GameOverScreen({ game, t, onRetry, onTitle }: GameOverProps) {
  const { run } = game;
  const g = t.gameOver;
  return (
    <section className="screen">
      <h1 className="screen-title">{g.title}</h1>
      <dl className="stats">
        <dt>{g.cause}</dt>
        <dd>{g.causes[game.cause]}</dd>
        <dt>{g.reachedStage}</dt>
        <dd>{run.stageNumber}</dd>
        <dt>{g.score}</dt>
        <dd>{run.score}</dd>
        <dt>{g.totalPp}</dt>
        <dd>{run.totalPp}</dd>
        <dt>{g.remainingPp}</dt>
        <dd>{run.pp}</dd>
        <dt>{g.length}</dt>
        <dd>{run.length}</dd>
        <dt>{g.modules}</dt>
        <dd className="stats-modules">
          <ModuleChips lines={describeModules(run.purchased, t)} t={t} empty={g.noModules} />
        </dd>
      </dl>
      <div className="modal-actions">
        <button type="button" className="button" onClick={onTitle}>
          {g.toTitle}
        </button>
        <button type="button" className="button button-primary" autoFocus onClick={onRetry}>
          {g.retry}
        </button>
      </div>
    </section>
  );
}
