import type { Session } from "../loop/session";
import { screenOf } from "../loop/view";
import { type BgmLevel, bgmLevel, soundsFor } from "./cues";
import type { AudioPlayer } from "./player";

/** セッションの変化を聞いて、効果音とBGMを鳴らす。音を決めるのはここだけ（ボタンの音を除く） */
export function connectAudio(session: Session, audio: AudioPlayer): void {
  let onTitle = session.view.getSnapshot().onTitle;
  let level: BgmLevel | null = null;
  const updateLevel = () => {
    const game = session.store.getSnapshot();
    const next = bgmLevel(screenOf(session.view.getSnapshot(), game), game.phase);
    if (next === level) return;
    level = next;
    audio.setBgmLevel(next);
  };

  session.onChange(({ prev, next, events }) => {
    for (const sound of soundsFor(prev, next, events)) audio.play(sound);
    updateLevel();
  });
  session.view.subscribe(() => {
    const view = session.view.getSnapshot();
    // ブラウザは操作の中でしか音を鳴らし始められない。タイトルを出るのは「ゲーム開始」などのクリックの中で起きる
    if (onTitle && !view.onTitle) audio.startBgm();
    onTitle = view.onTitle;
    updateLevel();
  });
  updateLevel();
}
