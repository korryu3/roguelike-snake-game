import { describe, expect, test } from "vite-plus/test";
import { CONFIG } from "../config";
import { begin } from "../logic/testing";
import { createSession } from "../loop/session";
import type { BgmLevel, SoundId } from "./cues";
import { connectAudio } from "./director";
import type { AudioPlayer } from "./player";

const fakePlayer = () => {
  const calls: string[] = [];
  const player: AudioPlayer = {
    play: (sound: SoundId) => void calls.push(`play:${sound}`),
    startBgm: () => void calls.push("startBgm"),
    setBgmLevel: (level: BgmLevel) => void calls.push(`level:${level}`),
    setVolumes: () => void calls.push("volumes"),
  };
  return { player, calls };
};

const seeds = () => {
  let seed = 0;
  return () => ++seed;
};

describe("connectAudio", () => {
  test("ゲームの変化から効果音を鳴らす", () => {
    const game = begin("right", { battery: { x: 8, y: 7 } });
    const session = createSession(seeds(), undefined, () => game);
    const { player, calls } = fakePlayer();
    connectAudio(session, player);
    session.advance(CONFIG.moveIntervalMs);
    expect(calls).toContain("play:pickup");
  });

  test("タイトルを出るときにBGMを流し始め、ステージでは元の音量にする", () => {
    const session = createSession(seeds());
    const { player, calls } = fakePlayer();
    connectAudio(session, player);
    calls.length = 0;
    session.startNewRun();
    expect(calls).toContain("startBgm");
    expect(calls.at(-1)).toBe("level:normal");
  });

  test("タイトルに戻るとBGMを下げ、流し直しはしない", () => {
    const session = createSession(seeds());
    const { player, calls } = fakePlayer();
    connectAudio(session, player);
    session.startNewRun();
    calls.length = 0;
    session.goToTitle();
    expect(calls).toEqual(["level:ducked"]);
  });
});
