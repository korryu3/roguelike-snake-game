import bgmUrl from "../assets/sounds/bgm.mp3";
import buttonUrl from "../assets/sounds/button.mp3";
import clearUrl from "../assets/sounds/clear.mp3";
import gameOverUrl from "../assets/sounds/game-over.mp3";
import goalUrl from "../assets/sounds/goal.mp3";
import hitUrl from "../assets/sounds/hit.mp3";
import pickupUrl from "../assets/sounds/pickup.mp3";
import reviveUrl from "../assets/sounds/revive.mp3";
import type { BgmLevel, SoundId } from "./cues";
import { bgmVolume, type Volumes } from "./volume";

const SOUND_URLS: Readonly<Record<SoundId, string>> = {
  pickup: pickupUrl,
  hit: hitUrl,
  goal: goalUrl,
  revive: reviveUrl,
  clear: clearUrl,
  gameOver: gameOverUrl,
  button: buttonUrl,
};

export type AudioPlayer = {
  readonly play: (sound: SoundId) => void;
  /** ブラウザは、クリックなどの操作の中でしか音を鳴らし始められない */
  readonly startBgm: () => void;
  readonly setBgmLevel: (level: BgmLevel) => void;
  readonly setVolumes: (volumes: Volumes) => void;
};

/** ブラウザの音の再生をまとめる。何を鳴らすかは決めない */
export function createAudioPlayer(initialVolumes: Volumes): AudioPlayer {
  const sounds = Object.fromEntries(
    Object.entries(SOUND_URLS).map(([id, url]) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      return [id, audio];
    }),
  ) as Record<SoundId, HTMLAudioElement>;
  const bgm = new Audio(bgmUrl);
  bgm.loop = true;
  let volumes = initialVolumes;
  let level: BgmLevel = "ducked";
  const applyBgmVolume = () => {
    bgm.volume = bgmVolume(volumes, level);
  };
  applyBgmVolume();

  // 再生できなかったとき（自動再生の制限など）は、音なしで続ける
  const ignore = () => {};

  return {
    play: (sound) => {
      if (volumes.sfx === 0) return;
      // 同じ音が続けて鳴っても重ねられるように、毎回複製して鳴らす
      const audio = sounds[sound].cloneNode() as HTMLAudioElement;
      audio.volume = volumes.sfx;
      audio.play().catch(ignore);
    },
    startBgm: () => {
      if (bgm.paused) bgm.play().catch(ignore);
    },
    setBgmLevel: (next) => {
      level = next;
      applyBgmVolume();
    },
    setVolumes: (next) => {
      volumes = next;
      applyBgmVolume();
    },
  };
}
