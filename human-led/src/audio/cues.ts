import type { Game, GameEvent } from "../logic/types";
import type { Screen } from "../loop/view";

export type SoundId = "pickup" | "damage" | "goal" | "revive" | "clear" | "gameOver" | "button";

/** ロジックの状態が変わったときに鳴らす効果音。ボタンの音は画面が鳴らす */
export function soundsFor(prev: Game, next: Game, events: readonly GameEvent[]): SoundId[] {
  const fromEvents = events.flatMap((event): SoundId[] => {
    const sound = soundOf(event);
    return sound ? [sound] : [];
  });
  // 諦めたときはイベントが出ないので、局面が変わったことで決める
  const gameOver = next.phase === "gameOver" && prev.phase !== "gameOver";
  return gameOver ? [...fromEvents, "gameOver"] : fromEvents;
}

function soundOf(event: GameEvent): SoundId | null {
  switch (event.type) {
    case "batteryEaten":
    case "heartCollected":
      return "pickup";
    // ぶつかったことより、ダメージを受けたことを知らせる。無敵時間中や壁ダメージ無効で防いだときは鳴らさない
    case "collided":
      return event.damaged ? "damage" : null;
    // 体を切った音は、まだ素材がないのでダメージの音を使う
    case "bodyCut":
      return "damage";
    case "goalAppeared":
      return "goal";
    case "revived":
      return "revive";
    case "cleared":
      return "clear";
    case "hpDepleted":
    case "timeUp":
      return null;
  }
}

export type BgmLevel = "normal" | "ducked";

/** クリアとゲームオーバーの音が聞こえるように、その画面のあいだはBGMを下げる */
export function bgmLevel(screen: Screen, phase: Game["phase"]): BgmLevel {
  if (screen !== "stage") return "ducked";
  return phase === "cleared" || phase === "shop" ? "ducked" : "normal";
}
