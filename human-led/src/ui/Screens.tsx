import type { Messages } from "../i18n/messages";
import type { Game } from "../logic/types";
import { ModuleChips } from "./Hud";
import { describeModules } from "./view";

/** 日本語を読めない人も見つけられるように、タイトルの設定ボタンは言語によらず両方の言葉で出す */
const TITLE_SETTINGS_LABEL = "⚙ 設定 / Settings";

type TitleProps = {
  readonly t: Messages;
  readonly onStart: () => void;
  readonly onOpenSettings: () => void;
};

export function TitleScreen({ t, onStart, onOpenSettings }: TitleProps) {
  return (
    <section className="screen title-screen">
      <h1 className="game-title">{t.title}</h1>
      <button type="button" className="button button-primary button-large" autoFocus onClick={onStart}>
        {t.startGame}
      </button>
      <button type="button" className="button" onClick={onOpenSettings}>
        {TITLE_SETTINGS_LABEL}
      </button>
    </section>
  );
}

type GameOverProps = {
  readonly game: Extract<Game, { phase: "gameOver" }>;
  readonly t: Messages;
  readonly onRetry: () => void;
  readonly onTitle: () => void;
  readonly onOpenSettings: () => void;
};

export function GameOverScreen({ game, t, onRetry, onTitle, onOpenSettings }: GameOverProps) {
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
      <button type="button" className="button" onClick={onOpenSettings}>
        {t.settings.openOutsideStage}
      </button>
    </section>
  );
}
