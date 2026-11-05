export const MAX_FRAME_MS = 100;

export function frameElapsedMs(previous: number | null, now: number): number {
  if (previous === null) return 0;
  return Math.min(Math.max(now - previous, 0), MAX_FRAME_MS);
}
