import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { soundsFor } from "./audio/cues";
import { createMuteStorage } from "./audio/mute";
import { createAudioPlayer } from "./audio/player";
import { startLoop } from "./loop/run";
import { createSession } from "./loop/session";
import { createLangStorage } from "./i18n/lang";
import { createTuningStorage } from "./tuning/storage";
import { App } from "./ui/App";

const root = document.getElementById("root");
if (!root) throw new Error("#root が見つからない");

const tuningStorage = createTuningStorage(() => window.localStorage);
const langStorage = createLangStorage(() => window.localStorage);
const session = createSession(() => Math.floor(Math.random() * 2 ** 32), tuningStorage.load());
const muteStorage = createMuteStorage(() => window.localStorage);
const audio = createAudioPlayer(muteStorage.load());
session.onChange(({ prev, next, events }) => {
  for (const sound of soundsFor(prev, next, events)) audio.play(sound);
});
startLoop(session);

createRoot(root).render(
  <StrictMode>
    <App session={session} tuningStorage={tuningStorage} langStorage={langStorage} audio={audio} muteStorage={muteStorage} />
  </StrictMode>,
);
