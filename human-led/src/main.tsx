import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { startLoop } from "./loop/run";
import { createSession } from "./loop/session";
import { App } from "./ui/App";

const root = document.getElementById("root");
if (!root) throw new Error("#root が見つからない");

const session = createSession(() => Math.floor(Math.random() * 2 ** 32));
startLoop(session);

createRoot(root).render(
  <StrictMode>
    <App session={session} />
  </StrictMode>,
);
