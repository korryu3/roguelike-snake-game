import { useEffect, useState, useSyncExternalStore } from "react";
import type { Tuning } from "../config";
import type { Lang, LangStorage } from "../i18n/lang";
import { MESSAGES, type Messages } from "../i18n/messages";
import type { Game } from "../logic/types";
import type { Session } from "../loop/session";
import type { TuningStorage } from "../tuning/storage";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { ClearModal, ReviveModal, ShopModal } from "./Modals";
import { GameOverScreen, TitleScreen } from "./Screens";
import { TuningPanel } from "./TuningPanel";
import "./app.css";

type Props = { session: Session; tuningStorage: TuningStorage; langStorage: LangStorage };

export function App({ session, tuningStorage, langStorage }: Props) {
  const game = useSyncExternalStore(session.store.subscribe, session.store.getSnapshot);
  const panelOpen = useSyncExternalStore(session.panelOpen.subscribe, session.panelOpen.getSnapshot);
  const [onTitle, setOnTitle] = useState(true);
  const [lang, setLang] = useState<Lang>(() => langStorage.load());
  const [draft, setDraft] = useState<Tuning>(() => game.run.tuning);
  const [saved, setSaved] = useState(true);
  const t = MESSAGES[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang, t]);

  const changeLang = (next: Lang) => {
    setLang(next);
    langStorage.save(next);
  };
  const changeDraft = (tuning: Tuning) => {
    setDraft(tuning);
    setSaved(tuningStorage.save(tuning));
  };
  const newRun = () => {
    session.restart(game.run.tuning);
    setOnTitle(false);
  };

  return (
    <main className="app">
      {onTitle ? (
        <TitleScreen t={t} lang={lang} onLangChange={changeLang} onStart={newRun} />
      ) : game.phase === "gameOver" ? (
        <GameOverScreen game={game} t={t} onRetry={newRun} onTitle={() => setOnTitle(true)} />
      ) : (
        <StageView game={game} t={t} session={session} />
      )}
      <p className="controls">{t.controls}</p>
      {panelOpen && (
        <TuningPanel draft={draft} running={game.run.tuning} saved={saved} onChange={changeDraft} onRestart={session.restart} />
      )}
    </main>
  );
}

function StageView({ game, t, session }: { game: Game; t: Messages; session: Session }) {
  const { perform } = session;
  return (
    <>
      <Hud game={game} t={t} />
      <div className="board">
        <Board game={game} />
      </div>
      <p className="board-hint" style={{ visibility: game.phase === "awaitingStart" ? "visible" : "hidden" }}>
        {t.pressToStart}
      </p>
      {game.phase === "cleared" && <ClearModal game={game} t={t} perform={perform} />}
      {game.phase === "shop" && <ShopModal game={game} t={t} perform={perform} />}
      {game.phase === "reviveChoice" && <ReviveModal game={game} t={t} perform={perform} />}
    </>
  );
}
