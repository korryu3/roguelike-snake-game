import { AUDIO } from "../config";
import type { BgmLevel } from "./cues";

/** どちらも0〜1 */
export type Volumes = { readonly bgm: number; readonly sfx: number };

export const DEFAULT_VOLUMES: Volumes = { bgm: AUDIO.bgmVolume, sfx: AUDIO.sfxVolume };

const KEY = "logsune.volumes";

type KeyValue = Pick<Storage, "getItem" | "setItem">;

export type VolumeStorage = {
  readonly load: () => Volumes;
  readonly save: (volumes: Volumes) => void;
};

/** localStorageは取り出すだけで例外が出る環境もあるので、取り出し方ごと受け取る */
export function createVolumeStorage(getStorage: () => KeyValue): VolumeStorage {
  return {
    load: () => {
      try {
        const saved: unknown = JSON.parse(getStorage().getItem(KEY) ?? "{}");
        const given = typeof saved === "object" && saved !== null ? (saved as Record<string, unknown>) : {};
        return { bgm: volumeOr(given.bgm, DEFAULT_VOLUMES.bgm), sfx: volumeOr(given.sfx, DEFAULT_VOLUMES.sfx) };
      } catch {
        return DEFAULT_VOLUMES;
      }
    },
    save: (volumes) => {
      try {
        getStorage().setItem(KEY, JSON.stringify(volumes));
      } catch {
        // 保存できなくても、その回は選んだ音量で鳴らす
      }
    },
  };
}

const volumeOr = (value: unknown, fallback: number): number =>
  typeof value === "number" && value >= 0 && value <= 1 ? value : fallback;

export function bgmVolume(volumes: Volumes, level: BgmLevel): number {
  return level === "ducked" ? volumes.bgm * AUDIO.duckRatio : volumes.bgm;
}
