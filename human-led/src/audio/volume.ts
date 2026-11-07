import { z } from "zod";
import { AUDIO } from "../config";
import type { BgmLevel } from "./cues";

/** どちらも0〜1 */
export type Volumes = { readonly bgm: number; readonly sfx: number };

export const DEFAULT_VOLUMES: Volumes = { bgm: AUDIO.bgmVolume, sfx: AUDIO.sfxVolume };

const volumeOr = (fallback: number) => z.number().min(0).max(1).catch(fallback);

/** 保存されていた値の検査。使えない音量は、その音量だけ既定にする */
export const volumesSchema = z
  .object({ bgm: volumeOr(DEFAULT_VOLUMES.bgm), sfx: volumeOr(DEFAULT_VOLUMES.sfx) })
  .catch(DEFAULT_VOLUMES);

export function bgmVolume(volumes: Volumes, level: BgmLevel): number {
  return level === "ducked" ? volumes.bgm * AUDIO.duckRatio : volumes.bgm;
}
