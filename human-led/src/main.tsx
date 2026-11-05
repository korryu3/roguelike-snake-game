import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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
startLoop(session);

createRoot(root).render(
  <StrictMode>
    <App session={session} tuningStorage={tuningStorage} langStorage={langStorage} />
  </StrictMode>,
);
