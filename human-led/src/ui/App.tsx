import { useSyncExternalStore } from "react";
import type { Session } from "../loop/session";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { Overlay } from "./Overlay";
import "./app.css";

export function App({ session }: { session: Session }) {
  const game = useSyncExternalStore(session.store.subscribe, session.store.getSnapshot);
  return (
    <main className="app">
      <Hud game={game} />
      <div className="board">
        <Board game={game} />
        <Overlay game={game} />
      </div>
      <p className="controls">WASD / 矢印キーで操作</p>
    </main>
  );
}
