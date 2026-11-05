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
  hud: {
    stage: (n) => `ステージ ${n}`,
    pp: (pp) => `PP ${pp}`,
    hp: (hp, maxHp) => `HP ${hp} / ${maxHp}`,
    modules: "モジュール",
    noModules: "なし",
  },
  cleared: {
    title: (n) => `ステージ ${n} クリア`,
    ppEarned: "獲得したPP",
    score: "獲得したスコア",
    batteryScore: "バッテリー",
    timeBonus: "時間ボーナス",
    elapsed: "かかった時間",
    toShop: "モジュールを選ぶ",
  },
  shop: {
    title: "モジュール",
    pp: (pp) => `所持PP ${pp}`,
    price: (price) => `${price} PP`,
    buy: "買う",
    sold: "売り切れ",
    notEnoughPp: "PPが足りない",
    reroll: (price) => `リロール（${price} PP）`,
    nextStage: "次のステージへ",
  },
  revive: {
    title: "HPが0になった",
    prompt: "生き返るモジュールを選ぶ",
    restoresTo: (hp, maxHp) => `HP ${hp} / ${maxHp} で復活`,
    giveUp: "諦める",
  },
  gameOver: {
    title: "ゲームオーバー",
    causes: { hp: "HPが0になった", timeUp: "時間切れ" },
    reachedStage: "到達ステージ",
    score: "スコア",
    cause: "死因",
    totalPp: "累計獲得PP",
    remainingPp: "残っていたPP",
    length: "最終的な長さ",
    modules: "買ったモジュール",
    noModules: "なし",
    retry: "もう一度",
    toTitle: "タイトルへ",
  },
  count: (count) => `×${count}`,
  modules: {
    doublePpAndGrowth: { name: "PP・伸び2倍", description: () => "バッテリー1個で得るPPと体の伸びが2倍になる。スコアは増えない" },
    revive: { name: "1回生き返る", description: () => "HPが0になったとき、HP満タンで生き返る。1回使うとなくなる" },
    reviveAtOneHp: { name: "1回生き返る（デメリット付き）", description: () => "HPが0になったとき、HP1で生き返る。1回使うとなくなる" },
    timeLimitPlus5s: { name: "制限時間＋5秒", description: (c) => `制限時間が${seconds(c.timeLimitPlusMs)}秒延びる。ずっと続く` },
    timeLimitBoostNextStage: { name: "制限時間の一時延長", description: (c) => `次のステージだけ、制限時間が${seconds(c.timeLimitBoostMs)}秒延びる` },
    wallDamageImmunity: { name: "壁ダメージ無効", description: () => "壁にぶつかってもHPが減らない。ぶつかるたびに1つ使う。自分の体にぶつかったときは効かない" },
    maxHpPlus1: { name: "HPの上限＋1", description: () => "HPの上限が1増え、今のHPも1増える" },
    doublePpBattery: { name: "PP2倍のバッテリー", description: (c) => `${percent(c.doublePpBatteryChancePerStack)}の確率で、PPが2倍のバッテリーが出る` },
  },
};

const en: Messages = {
  title: "RoguelikeSnakeGame",
  startGame: "Start Game",
  language: "Language",
  controls: "Move with WASD / Arrow keys",
  pressToStart: "Press a direction key to start",
  hud: {
    stage: (n) => `Stage ${n}`,
    pp: (pp) => `PP ${pp}`,
    hp: (hp, maxHp) => `HP ${hp} / ${maxHp}`,
    modules: "Modules",
    noModules: "None",
  },
  cleared: {
    title: (n) => `Stage ${n} cleared`,
    ppEarned: "PP earned",
    score: "Score earned",
    batteryScore: "Energy Cells",
    timeBonus: "Time bonus",
    elapsed: "Time taken",
    toShop: "Choose modules",
  },
  shop: {
    title: "Modules",
    pp: (pp) => `${pp} PP available`,
    price: (price) => `${price} PP`,
    buy: "Buy",
    sold: "Sold out",
    notEnoughPp: "Not enough PP",
    reroll: (price) => `Reroll (${price} PP)`,
    nextStage: "Next stage",
  },
  revive: {
    title: "HP reached 0",
    prompt: "Choose a module to revive with",
    restoresTo: (hp, maxHp) => `Revive with HP ${hp} / ${maxHp}`,
    giveUp: "Give up",
  },
  gameOver: {
    title: "Game Over",
    causes: { hp: "HP reached 0", timeUp: "Time up" },
    reachedStage: "Stage reached",
    score: "Score",
    cause: "Cause",
    totalPp: "Total PP earned",
    remainingPp: "PP left",
    length: "Final length",
    modules: "Modules bought",
    noModules: "None",
    retry: "Play again",
    toTitle: "Back to title",
  },
  count: (count) => `×${count}`,
  modules: {
    doublePpAndGrowth: { name: "Double PP & Growth", description: () => "Each Energy Cell gives double PP and grows you by 2. Score is unchanged" },
    revive: { name: "Revive", description: () => "When HP reaches 0, revive with full HP. Used up once triggered" },
    reviveAtOneHp: { name: "Revive (Drawback)", description: () => "When HP reaches 0, revive with 1 HP. Used up once triggered" },
    timeLimitPlus5s: { name: "Time Limit +5s", description: (c) => `Adds ${seconds(c.timeLimitPlusMs)}s to the time limit for the rest of the run` },
    timeLimitBoostNextStage: { name: "Temporary Time Extension", description: (c) => `Adds ${seconds(c.timeLimitBoostMs)}s to the time limit of the next stage only` },
    wallDamageImmunity: { name: "Wall Damage Immunity", description: () => "Hitting a wall costs no HP. One is used per hit. Does not cover hitting yourself" },
    maxHpPlus1: { name: "Max HP +1", description: () => "Raises max HP by 1 and heals 1 HP" },
    doublePpBattery: { name: "Double-PP Energy Cell", description: (c) => `${percent(c.doublePpBatteryChancePerStack)} of Energy Cells give double PP` },
  },
};

export const MESSAGES: Readonly<Record<Lang, Messages>> = { ja, en };
