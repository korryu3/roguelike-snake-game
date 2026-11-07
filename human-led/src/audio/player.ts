import bgmUrl from "../assets/sounds/bgm.mp3";
import buttonUrl from "../assets/sounds/button.mp3";
import clearUrl from "../assets/sounds/clear.mp3";
import gameOverUrl from "../assets/sounds/game-over.mp3";
import goalUrl from "../assets/sounds/goal.mp3";
import hitUrl from "../assets/sounds/hit.mp3";
import pickupUrl from "../assets/sounds/pickup.mp3";
import reviveUrl from "../assets/sounds/revive.mp3";
import type { BgmLevel, SoundId } from "./cues";

const SOUND_URLS: Readonly<Record<SoundId, string>> = {
  pickup: pickupUrl,
  hit: hitUrl,
  goal: goalUrl,
  revive: reviveUrl,
  clear: clearUrl,
  gameOver: gameOverUrl,
  button: buttonUrl,
};

/** 音量は例。聞いてから調整する */
const SOUND_VOLUME = 0.6;
const BGM_VOLUME: Readonly<Record<BgmLevel, number>> = { normal: 0.4, ducked: 0.12 };

export type AudioPlayer = {
  readonly play: (sound: SoundId) => void;
  /** ブラウザは、クリックなどの操作の中でしか音を鳴らし始められない */
  readonly startBgm: () => void;
  readonly setBgmLevel: (level: BgmLevel) => void;
  readonly setMuted: (muted: boolean) => void;
};

export function createAudioPlayer(initiallyMuted: boolean): AudioPlayer {
  const sounds = Object.fromEntries(
    Object.entries(SOUND_URLS).map(([id, url]) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      return [id, audio];
    }),
  ) as Record<SoundId, HTMLAudioElement>;
  const bgm = new Audio(bgmUrl);
  bgm.loop = true;
  bgm.volume = BGM_VOLUME.ducked;
  let muted = initiallyMuted;
  bgm.muted = muted;

  // 再生できなかったとき（自動再生の制限など）は、音なしで続ける
  const ignore = () => {};

  return {
    play: (sound) => {
      if (muted) return;
      // 同じ音が続けて鳴っても重ねられるように、毎回複製して鳴らす
      const audio = sounds[sound].cloneNode() as HTMLAudioElement;
      audio.volume = SOUND_VOLUME;
      audio.play().catch(ignore);
    },
    startBgm: () => {
      if (bgm.paused) bgm.play().catch(ignore);
    },
    setBgmLevel: (level) => {
      bgm.volume = BGM_VOLUME[level];
    },
    setMuted: (next) => {
      muted = next;
      bgm.muted = next;
    },
  };
}
