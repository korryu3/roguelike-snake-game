import { useState, useSyncExternalStore } from "react";
import type { Tuning } from "../config";
import type { Session } from "../loop/session";
import type { TuningStorage } from "../tuning/storage";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { Overlay } from "./Overlay";
import { TuningPanel } from "./TuningPanel";
import "./app.css";

export function App({ session, tuningStorage }: { session: Session; tuningStorage: TuningStorage }) {
  const game = useSyncExternalStore(session.store.subscribe, session.store.getSnapshot);
  const panelOpen = useSyncExternalStore(session.panelOpen.subscribe, session.panelOpen.getSnapshot);
  const [draft, setDraft] = useState<Tuning>(() => game.run.tuning);
  const [saved, setSaved] = useState(true);
  const changeDraft = (tuning: Tuning) => {
    setDraft(tuning);
    setSaved(tuningStorage.save(tuning));
  };
  return (
    <main className="app">
      <Hud game={game} />
      <div className="board">
        <Board game={game} />
        <Overlay game={game} />
      </div>
      <p className="controls">WASD / 矢印キーで操作</p>
      {panelOpen && (
        <TuningPanel draft={draft} running={game.run.tuning} saved={saved} onChange={changeDraft} onRestart={session.restart} />
      )}
    </main>
  );
}
