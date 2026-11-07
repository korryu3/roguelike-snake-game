import type { Messages } from "../i18n/messages";
import type { Game } from "../logic/types";
import { GameButton } from "./GameButton";
import { ModuleChips } from "./Hud";
import { Stat, Stats } from "./Stats";
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
    <section className="flex flex-col items-center gap-8">
      <h1 className="m-0 text-6xl tracking-widest text-highlight [text-shadow:0_0_24px_rgb(14_165_233/0.6)]">
        {t.title}
      </h1>
      {/* 同じ大きさにそろえる。幅は長いほうの文字に合わせる */}
      <div className="flex flex-col items-stretch gap-6">
        <GameButton size="hero" autoFocus onClick={onStart}>
          {t.startGame}
        </GameButton>
        <GameButton tone="normal" size="hero" onClick={onOpenSettings}>
          {TITLE_SETTINGS_LABEL}
        </GameButton>
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

/** 設定は、モジュール選択などと同じく、Escで開く */
export function GameOverScreen({ game, t, onRetry, onTitle }: GameOverProps) {
  const { run } = game;
  const g = t.gameOver;
  return (
    <section className="flex flex-col items-center gap-5">
      <h1 className="m-0 text-4xl">{g.title}</h1>
      <Stats>
        <Stat label={g.cause}>{g.causes[game.cause]}</Stat>
        <Stat label={g.reachedStage}>{run.stageNumber}</Stat>
        <Stat label={g.score}>{run.score}</Stat>
        <Stat label={g.totalPp}>{run.totalPp}</Stat>
        <Stat label={g.remainingPp}>{run.pp}</Stat>
        <Stat label={g.length}>{run.length}</Stat>
        <Stat label={g.modules}>
          <span className="flex max-w-90 flex-wrap justify-end gap-1.5">
            <ModuleChips lines={describeModules(run.purchased, t)} t={t} empty={g.noModules} />
          </span>
        </Stat>
      </Stats>
      <div className="flex justify-center gap-3">
        <GameButton tone="normal" onClick={onTitle}>
          {g.toTitle}
        </GameButton>
        <GameButton autoFocus onClick={onRetry}>
          {g.retry}
        </GameButton>
      </div>
    </section>
  );
}
