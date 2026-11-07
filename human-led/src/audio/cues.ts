import type { Game, GameEvent } from "../logic/types";
import type { Screen } from "../loop/view";

export type SoundId = "pickup" | "hit" | "goal" | "revive" | "clear" | "gameOver" | "button";

/** ロジックの状態が変わったときに鳴らす効果音。ボタンの音は画面が鳴らす */
export function soundsFor(prev: Game, next: Game, events: readonly GameEvent[]): SoundId[] {
  const fromEvents = events.flatMap((event): SoundId[] => {
    const sound = EVENT_SOUNDS[event.type];
    return sound ? [sound] : [];
  });
  // 諦めたときはイベントが出ないので、局面が変わったことで決める
  const gameOver = next.phase === "gameOver" && prev.phase !== "gameOver";
  return gameOver ? [...fromEvents, "gameOver"] : fromEvents;
}

const EVENT_SOUNDS: Readonly<Record<GameEvent["type"], SoundId | null>> = {
  batteryEaten: "pickup",
  heartCollected: "pickup",
  collided: "hit",
  goalAppeared: "goal",
  revived: "revive",
  cleared: "clear",
  hpDepleted: null,
  timeUp: null,
};

export type BgmLevel = "normal" | "ducked";

/** クリアとゲームオーバーの音が聞こえるように、その画面のあいだはBGMを下げる */
export function bgmLevel(screen: Screen, phase: Game["phase"]): BgmLevel {
  if (screen !== "stage") return "ducked";
  return phase === "cleared" || phase === "shop" ? "ducked" : "normal";
}
