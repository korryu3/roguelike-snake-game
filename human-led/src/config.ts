export const CONFIG = {
  boardSize: 15,
  moveIntervalMs: 150,
  timeLimitMs: 120_000,
  batteriesToGoal: 8,
  initialHp: 3,
  initialLength: 3,
  ppPerBattery: 1,
  stunMs: 1_000,
  invincibleMs: 1_500,
  inputQueueLimit: 2,
} as const;
