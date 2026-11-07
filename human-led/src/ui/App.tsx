import { type MouseEvent, useEffect, useState, useSyncExternalStore } from "react";
import type { AudioPlayer } from "../audio/player";
import type { Tuning } from "../config";
import { MESSAGES, type Messages } from "../i18n/messages";
import type { Game } from "../logic/types";
import type { Session } from "../loop/session";
import { menuReturnsToStage, screenOf } from "../loop/view";
import type { Preferences, PreferencesStorage } from "../preferences/storage";
import { boardPx } from "../render/style";
import type { TuningStorage } from "../tuning/storage";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { ClearModal, ReviveModal, ShopModal } from "./Modals";
import { GameOverScreen, TitleScreen } from "./Screens";
import { SettingsMenu } from "./SettingsMenu";
import { TuningPanel } from "./TuningPanel";
import "./app.css";

type Props = {
  readonly session: Session;
  readonly audio: AudioPlayer;
  readonly tuningStorage: TuningStorage;
  readonly preferencesStorage: PreferencesStorage;
  readonly initialPreferences: Preferences;
};

/** セッションの状態を描き、画面の操作をセッションに渡す。音を決めるのはaudio/director.ts（ボタンの音を除く） */
export function App({ session, audio, tuningStorage, preferencesStorage, initialPreferences }: Props) {
  const game = useSyncExternalStore(session.store.subscribe, session.store.getSnapshot);
  const view = useSyncExternalStore(session.view.subscribe, session.view.getSnapshot);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [draft, setDraft] = useState<Tuning>(() => game.run.tuning);
  const [saved, setSaved] = useState(true);
  const t = MESSAGES[preferences.lang];

  useEffect(() => {
    document.documentElement.lang = preferences.lang;
    document.title = t.title;
  }, [preferences.lang, t]);

  const changePreferences = (next: Preferences) => {
    setPreferences(next);
    audio.setVolumes(next.volumes);
    preferencesStorage.save(next);
  };
  const changeDraft = (tuning: Tuning) => {
    setDraft(tuning);
    setSaved(tuningStorage.save(tuning));
  };
  const toggleMenu = () => session.command({ kind: "toggleMenu" });
  // 画面のボタンは、まとめてボタンの音を鳴らす。自分の音があるボタンと調整パネルには、data-silentを付けて除く
  const playButtonSound = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button");
    if (button && !button.disabled && !button.closest("[data-silent]")) audio.play("button");
  };

  const screen = screenOf(view, game);
  return (
    <main className="app" onClick={playButtonSound}>
      {screen === "title" && <TitleScreen t={t} onStart={session.startNewRun} onOpenSettings={toggleMenu} />}
      {screen === "gameOver" && game.phase === "gameOver" && (
        <GameOverScreen
          game={game}
          t={t}
          onRetry={session.startNewRun}
          onTitle={session.goToTitle}
          onOpenSettings={toggleMenu}
        />
      )}
      {screen === "stage" && <StageView game={game} t={t} session={session} onOpenSettings={toggleMenu} />}
      <p className="controls">{t.controls}</p>
      {view.menuOpen && (
        <SettingsMenu
          t={t}
          preferences={preferences}
          returnsToStage={menuReturnsToStage(view, game)}
          onChange={changePreferences}
          onSfxPreview={() => audio.play("pickup")}
          onClose={toggleMenu}
        />
      )}
      {view.panelOpen && (
        <TuningPanel
          draft={draft}
          running={game.run.tuning}
          saved={saved}
          onChange={changeDraft}
          onRestart={session.restart}
        />
      )}
    </main>
  );
}

type StageProps = {
  readonly game: Game;
  readonly t: Messages;
  readonly session: Session;
  readonly onOpenSettings: () => void;
};

function StageView({ game, t, session, onOpenSettings }: StageProps) {
  const { perform } = session;
  const waiting = game.phase === "awaitingStart" || game.phase === "paused";
  return (
    <>
      {/* 盤面と同じ幅の列の右上、時間制限の真上に置く */}
      <div className="top-bar" style={{ width: boardPx(game.run.tuning.config.boardSize) }}>
        <button type="button" className="button settings-open" onClick={onOpenSettings}>
          {t.settings.open}
        </button>
      </div>
      <Hud game={game} t={t} />
      <div className="board">
        <Board game={game} />
      </div>
      <p className="board-hint" style={{ visibility: waiting ? "visible" : "hidden" }}>
        {game.phase === "paused" ? t.pressToResume : t.pressToStart}
      </p>
      {game.phase === "cleared" && <ClearModal game={game} t={t} perform={perform} />}
      {game.phase === "shop" && <ShopModal game={game} t={t} perform={perform} />}
      {game.phase === "reviveChoice" && <ReviveModal game={game} t={t} perform={perform} />}
    </>
  );
}
