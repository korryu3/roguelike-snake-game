import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { connectAudio } from "./audio/director";
import { createAudioPlayer } from "./audio/player";
import { startLoop } from "./loop/run";
import { createSession } from "./loop/session";
import { loadSprites } from "./render/loadSprites";
import { createPreferencesStorage } from "./preferences/storage";
import { createTuningStorage } from "./tuning/storage";
import { App } from "./ui/App";
import { SpritesProvider } from "./ui/sprites";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root が見つからない");

const tuningStorage = createTuningStorage(() => window.localStorage);
const preferencesStorage = createPreferencesStorage(() => window.localStorage);
const preferences = preferencesStorage.load();

const session = createSession(() => Math.floor(Math.random() * 2 ** 32), tuningStorage.load());
const audio = createAudioPlayer(preferences.volumes);
connectAudio(session, audio);

const reactRoot = createRoot(root);
// 画像をデコードし終えるまでは、読み込み中と出す（ゲームも進めない）
reactRoot.render(<p className="grid min-h-screen place-items-center text-lg text-muted-foreground">Loading…</p>);
const sprites = await loadSprites();
startLoop(session);
reactRoot.render(
  <StrictMode>
    <SpritesProvider value={sprites}>
      <App
        session={session}
        audio={audio}
        tuningStorage={tuningStorage}
        preferencesStorage={preferencesStorage}
        initialPreferences={preferences}
      />
    </SpritesProvider>
  </StrictMode>,
);
