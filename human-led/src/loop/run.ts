import { frameElapsedMs } from "./frame";
import { commandOfKey, isTypingTarget } from "./keys";
import type { Session } from "./session";

export function startLoop(session: Session): void {
  let frame: number | null = null;
  let previous: number | null = null;

  const tick = (now: number) => {
    session.advance(frameElapsedMs(previous, now));
    previous = now;
    frame = requestAnimationFrame(tick);
  };
  const resume = () => {
    if (frame !== null) return;
    previous = null;
    frame = requestAnimationFrame(tick);
  };
  const pause = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };
  const onVisibilityChange = () => (document.hidden ? pause() : resume());
  const onKeyDown = (event: KeyboardEvent) => {
    const command = commandOfKey(event.code);
    if (command === null) return;
    // 入力欄にいるときも、Escだけは設定メニューの開閉に使う
    if (command.kind !== "toggleMenu" && event.target instanceof HTMLElement && isTypingTarget(event.target)) return;
    event.preventDefault();
    if (!event.repeat) session.command(command);
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("keydown", onKeyDown);
  if (!document.hidden) resume();
}
