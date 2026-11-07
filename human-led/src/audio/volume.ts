import { AUDIO } from "../config";
import type { BgmLevel } from "./cues";

/** どちらも0〜1 */
export type Volumes = { readonly bgm: number; readonly sfx: number };

export const DEFAULT_VOLUMES: Volumes = { bgm: AUDIO.bgmVolume, sfx: AUDIO.sfxVolume };

/** 保存されていた値を読む。使えない音量は、その音量だけ既定にする */
export function parseVolumes(value: unknown): Volumes {
  const given = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return { bgm: volumeOr(given.bgm, DEFAULT_VOLUMES.bgm), sfx: volumeOr(given.sfx, DEFAULT_VOLUMES.sfx) };
}

const volumeOr = (value: unknown, fallback: number): number =>
  typeof value === "number" && value >= 0 && value <= 1 ? value : fallback;

export function bgmVolume(volumes: Volumes, level: BgmLevel): number {
  return level === "ducked" ? volumes.bgm * AUDIO.duckRatio : volumes.bgm;
}
