import type { Config } from "../config";
import type { DeathCause, ModuleId } from "../logic/types";
import type { Lang } from "./lang";

type ModuleText = { readonly name: string; readonly description: (config: Config) => string };

/** 日本語と英語の辞書は、どちらもこの形にそろえる。片方にだけあるキーは型エラーになる */
export type Messages = {
  readonly title: string;
  readonly startGame: string;
  readonly language: string;
  readonly controls: string;
  readonly pressToStart: string;
  readonly pressToResume: string;
  readonly settings: {
    readonly open: string;
    readonly title: string;
    readonly resume: string;
    readonly close: string;
    readonly bgm: string;
    readonly sfx: string;
    readonly giveUp: string;
    readonly confirmGiveUp: string;
    readonly keepPlaying: string;
  };
  readonly hud: {
    readonly stage: (stageNumber: number) => string;
    readonly pp: (pp: number) => string;
    readonly hp: (hp: number, maxHp: number) => string;
    readonly modules: string;
    readonly noModules: string;
  };
  readonly cleared: {
    readonly title: (stageNumber: number) => string;
    readonly ppEarned: string;
    readonly score: string;
    readonly batteryScore: string;
    readonly timeBonus: string;
    readonly elapsed: string;
    readonly toShop: string;
  };
  readonly shop: {
    readonly title: string;
    readonly pp: (pp: number) => string;
    readonly price: (price: number) => string;
    readonly buy: string;
    readonly sold: string;
    readonly notEnoughPp: string;
    readonly reroll: (price: number) => string;
    readonly nextStage: string;
  };
  readonly revive: {
    readonly title: string;
    readonly prompt: string;
    readonly restoresTo: (hp: number, maxHp: number) => string;
    readonly giveUp: string;
  };
  readonly gameOver: {
    readonly title: string;
    readonly causes: Readonly<Record<DeathCause, string>>;
    readonly reachedStage: string;
    readonly score: string;
    readonly cause: string;
    readonly totalPp: string;
    readonly remainingPp: string;
    readonly length: string;
    readonly modules: string;
    readonly noModules: string;
    readonly retry: string;
    readonly toTitle: string;
  };
  readonly count: (count: number) => string;
  readonly modules: Readonly<Record<ModuleId, ModuleText>>;
};

const seconds = (ms: number) => ms / 1000;

const percent = (chance: number) => `${Math.round(chance * 100)}%`;

const ja: Messages = {
  title: "ログスネ",
  startGame: "ゲーム開始",
  language: "言語",
  controls: "WASD / 矢印キーで操作",
  pressToStart: "方向キーで開始",
  pressToResume: "方向キーで再開",
  settings: {
    open: "⏸ 設定",
    title: "設定",
    resume: "再開",
    close: "閉じる",
    bgm: "BGM",
    sfx: "効果音",
    giveUp: "諦める",
    confirmGiveUp: "本当に諦めますか？",
    keepPlaying: "続ける",
  },
  hud: {
    stage: (n) => `ステージ ${n}`,
    pp: (pp) => `PP ${pp}`,
    hp: (hp, maxHp) => `HP ${hp} / ${maxHp}`,
    modules: "モジュール",
    noModules: "なし",
  },
  cleared: {
    title: (n) => `ステージ ${n} クリア`,
    ppEarned: "獲得PP",
    score: "獲得スコア",
    batteryScore: "バッテリー",
    timeBonus: "タイムボーナス",
    elapsed: "クリアタイム",
    toShop: "モジュール選択",
  },
  shop: {
    title: "モジュール選択",
    pp: (pp) => `所持PP ${pp}`,
    price: (price) => `${price} PP`,
    buy: "購入",
    sold: "購入済み",
    notEnoughPp: "PP不足",
    reroll: (price) => `リロール（${price} PP）`,
    nextStage: "次のステージへ",
  },
  revive: {
    title: "HP 0",
    prompt: "復活モジュールを選択",
    restoresTo: (hp, maxHp) => `HP ${hp} / ${maxHp} で復活`,
    giveUp: "諦める",
  },
  gameOver: {
    title: "ゲームオーバー",
    causes: { hp: "HP 0", timeUp: "タイムアップ", gaveUp: "諦めた" },
    reachedStage: "到達ステージ",
    score: "スコア",
    cause: "死因",
    totalPp: "累計獲得PP",
    remainingPp: "残PP",
    length: "スネークの長さ",
    modules: "購入モジュール",
    noModules: "なし",
    retry: "もう一度",
    toTitle: "タイトルへ",
  },
  count: (count) => `×${count}`,
  modules: {
    doublePpAndGrowth: {
      name: "PP・伸び2倍",
      description: () => "バッテリーから取得できるPPと体の伸びが2倍になる。重ねると1つにつき1倍ずつ増える（2つで3倍）",
    },
    revive: { name: "1回復活（完全回復）", description: () => "HPが0になったらHP満タンで復活（使い切り）" },
    reviveAtOneHp: { name: "1回復活（一部回復）", description: () => "HPが0になったらHP1で復活（使い切り）" },
    timeLimitPlus5s: {
      name: "制限時間延長（永続）",
      description: (c) => `制限時間が${seconds(c.timeLimitPlusMs)}秒延びる（永続）`,
    },
    timeLimitBoostNextStage: {
      name: "制限時間延長（次のステージ）",
      description: (c) => `次のステージだけ、制限時間が${seconds(c.timeLimitBoostMs)}秒延びる`,
    },
    wallDamageImmunity: {
      name: "壁ダメージ無効",
      description: () => "1度だけ壁にぶつかってもHPが減らない（体は対象外・使い切り）",
    },
    maxHpPlus1: { name: "HPの上限＋1", description: () => "HPの上限が1増える" },
    doublePpBattery: {
      name: "PP2倍のバッテリー",
      description: (c) => `${percent(c.doublePpBatteryChancePerStack)}の確率で、PPが2倍のバッテリーが出現`,
    },
    bodyCut: {
      name: "体の切断（1回）",
      description: () => "長くなった体を短くできる。自分の体にぶつかると、そこから先が切れる（HPは減らない）",
    },
    fasterMovement: {
      name: "移動速度アップ",
      description: (c) => `スネークの移動スピードが${c.fasterMovementMultiplier}倍速くなる`,
    },
    slowerMovement: {
      name: "移動速度ダウン",
      description: (c) => `スネークの移動スピードが${c.slowerMovementMultiplier}倍に遅くなる`,
    },
    extraModuleChoice: {
      name: "モジュール候補＋1",
      description: (c) =>
        `${percent(c.extraModuleChoiceChancePerStack)}の確率で、選べるモジュールが${c.shopOfferCount + 1}つになる`,
    },
  },
};

const en: Messages = {
  title: "RLSG",
  startGame: "Start Game",
  language: "Language",
  controls: "Move with WASD / Arrow keys",
  pressToStart: "Press a direction key to start",
  pressToResume: "Press a direction key to resume",
  settings: {
    open: "⏸ Settings",
    title: "Settings",
    resume: "Resume",
    close: "Close",
    bgm: "Music",
    sfx: "Sound effects",
    giveUp: "Give up",
    confirmGiveUp: "Give up this run?",
    keepPlaying: "Keep playing",
  },
  hud: {
    stage: (n) => `Stage ${n}`,
    pp: (pp) => `PP ${pp}`,
    hp: (hp, maxHp) => `HP ${hp} / ${maxHp}`,
    modules: "Modules",
    noModules: "None",
  },
  cleared: {
    title: (n) => `Stage ${n} Cleared`,
    ppEarned: "PP earned",
    score: "Score earned",
    batteryScore: "Energy Cells",
    timeBonus: "Time bonus",
    elapsed: "Clear time",
    toShop: "Select Modules",
  },
  shop: {
    title: "Select Modules",
    pp: (pp) => `PP ${pp}`,
    price: (price) => `${price} PP`,
    buy: "Buy",
    sold: "Purchased",
    notEnoughPp: "Not enough PP",
    reroll: (price) => `Reroll (${price} PP)`,
    nextStage: "Next Stage",
  },
  revive: {
    title: "HP 0",
    prompt: "Select a revive module",
    restoresTo: (hp, maxHp) => `Revive with HP ${hp} / ${maxHp}`,
    giveUp: "Give Up",
  },
  gameOver: {
    title: "Game Over",
    causes: { hp: "HP 0", timeUp: "Time up", gaveUp: "Gave up" },
    reachedStage: "Stage reached",
    score: "Score",
    cause: "Cause",
    totalPp: "Total PP earned",
    remainingPp: "PP left",
    length: "Snake length",
    modules: "Purchased modules",
    noModules: "None",
    retry: "Play Again",
    toTitle: "Back to Title",
  },
  count: (count) => `×${count}`,
  modules: {
    doublePpAndGrowth: {
      name: "Double PP & Growth",
      description: () => "Energy Cells give double PP and double growth. Each extra copy adds 1x (two copies: 3x)",
    },
    revive: { name: "Revive (Full)", description: () => "When HP reaches 0, revive with full HP (single use)" },
    reviveAtOneHp: { name: "Revive (Partial)", description: () => "When HP reaches 0, revive with 1 HP (single use)" },
    timeLimitPlus5s: {
      name: "Time Extension (Permanent)",
      description: (c) => `Adds ${seconds(c.timeLimitPlusMs)}s to the time limit (permanent)`,
    },
    timeLimitBoostNextStage: {
      name: "Time Extension (Next Stage)",
      description: (c) => `Adds ${seconds(c.timeLimitBoostMs)}s to the time limit of the next stage only`,
    },
    wallDamageImmunity: {
      name: "Wall Damage Immunity",
      description: () => "Hitting a wall once costs no HP (not your own body, single use)",
    },
    maxHpPlus1: { name: "Max HP +1", description: () => "Raises max HP by 1" },
    doublePpBattery: {
      name: "Double-PP Energy Cell",
      description: (c) => `${percent(c.doublePpBatteryChancePerStack)} chance that a double-PP Energy Cell appears`,
    },
    bodyCut: {
      name: "Body Cut (Once)",
      description: () => "Shortens your body: hit your own body to cut it off there (no HP lost)",
    },
    fasterMovement: {
      name: "Faster Movement",
      description: (c) => `The snake moves ${c.fasterMovementMultiplier}x faster`,
    },
    slowerMovement: {
      name: "Slower Movement",
      description: (c) => `The snake moves at ${c.slowerMovementMultiplier}x speed`,
    },
    extraModuleChoice: {
      name: "Extra Module Choice",
      description: (c) =>
        `${percent(c.extraModuleChoiceChancePerStack)} chance to choose from ${c.shopOfferCount + 1} modules`,
    },
  },
};

export const MESSAGES: Readonly<Record<Lang, Messages>> = { ja, en };
