import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const root = document.getElementById("root");
if (!root) throw new Error("#root が見つからない");

createRoot(root).render(
  <StrictMode>
    <h1>ログスネ</h1>
  </StrictMode>,
);
