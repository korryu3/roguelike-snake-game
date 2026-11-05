import type { DeathCause, Game } from "../logic/types";

const DEATH_LABEL: Record<DeathCause, string> = { hp: "HPが0", timeUp: "時間切れ" };

const RESTART_HINT = "Rキーで最初から";

export function Overlay({ game }: { game: Game }) {
  switch (game.phase) {
    case "awaitingStart":
      return <Message title="方向キーで開始" prompt />;
    case "cleared":
      return <Message title="クリア" hint={RESTART_HINT} />;
    case "gameOver":
      return <Message title={`ゲームオーバー（${DEATH_LABEL[game.cause]}）`} hint={RESTART_HINT} />;
    default:
      return null;
  }
}

function Message({ title, hint, prompt = false }: { title: string; hint?: string; prompt?: boolean }) {
  return (
    <div className={prompt ? "overlay overlay-prompt" : "overlay"}>
      <p className="overlay-title">{title}</p>
      {hint && <p className="overlay-hint">{hint}</p>}
    </div>
  );
}
