export type Direction = "up" | "down" | "left" | "right";

export type Cell = { readonly x: number; readonly y: number };

export type RngState = number;

export type ModuleId =
  | "doublePpAndGrowth"
  | "revive"
  | "reviveAtOneHp"
  | "timeLimitPlus5s"
  | "timeLimitBoostNextStage"
  | "wallDamageImmunity"
  | "maxHpPlus1"
  | "doublePpBattery";

export type RunState = {
  readonly length: number;
  readonly hp: number;
  readonly pp: number;
  readonly totalPp: number;
  readonly score: number;
  /** 1回買うごとに1要素。使い切るものは、使うと要素が1つ減る */
  readonly modules: readonly ModuleId[];
  readonly stageNumber: number;
  readonly rng: RngState;
};

export type StageState = {
  /** 先頭が頭 */
  readonly body: readonly [Cell, ...Cell[]];
  readonly walls: readonly Cell[];
  readonly battery: Cell;
  readonly goal: Cell | null;
  readonly hearts: readonly Cell[];
  readonly timeLimitMs: number;
  readonly remainingMs: number;
  readonly batteriesEaten: number;
  readonly ppEarned: number;
};

export type Motion =
  | { readonly kind: "moving"; readonly sinceLastMoveMs: number }
  | { readonly kind: "stunned"; readonly remainingMs: number };

/** 最初の方向入力のあとにだけ存在する、スネークの動きの状態 */
export type Movement = {
  readonly direction: Direction;
  readonly queuedInputs: readonly Direction[];
  readonly motion: Motion;
  readonly invincibleMs: number;
};

export type DeathCause = "hp" | "timeUp";

/** クリアのモーダルに出す、そのステージの結果 */
export type ClearSummary = {
  readonly stageNumber: number;
  readonly ppEarned: number;
  readonly batteryScore: number;
  readonly timeBonus: number;
  readonly elapsedMs: number;
};

export type Game =
  | { readonly phase: "awaitingStart"; readonly run: RunState; readonly stage: StageState }
  | {
      readonly phase: "playing";
      readonly run: RunState;
      readonly stage: StageState;
      readonly movement: Movement;
    }
  | {
      readonly phase: "reviveChoice";
      readonly run: RunState;
      readonly stage: StageState;
      readonly movement: Movement;
    }
  | { readonly phase: "cleared"; readonly run: RunState; readonly stage: StageState; readonly summary: ClearSummary }
  | { readonly phase: "shop"; readonly run: RunState }
  | { readonly phase: "gameOver"; readonly run: RunState; readonly cause: DeathCause };

export type Obstacle = "wall" | "body";

export type GameEvent =
  | { readonly type: "batteryEaten"; readonly at: Cell }
  | { readonly type: "collided"; readonly obstacle: Obstacle; readonly damaged: boolean }
  | { readonly type: "heartCollected"; readonly at: Cell }
  | { readonly type: "goalAppeared"; readonly at: Cell }
  | { readonly type: "cleared" }
  | { readonly type: "hpDepleted" }
  | { readonly type: "timeUp" }
  | { readonly type: "revived" };

export type StepResult = { readonly game: Game; readonly events: readonly GameEvent[] };

/** 盤面の配置やランの数値を固定してランを始めるための指定。省略した項目は通常どおり決まる */
export type RunSetup = {
  readonly walls?: readonly Cell[];
  readonly battery?: Cell;
  readonly goal?: Cell;
  readonly batteriesEaten?: number;
  readonly length?: number;
  readonly hp?: number;
  readonly modules?: readonly ModuleId[];
};
