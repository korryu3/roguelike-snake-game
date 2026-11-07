import { describe, expect, test } from "vite-plus/test";
import { CONFIG, DEFAULT_TUNING, type Tuning } from "../config";
import { startRun } from "../logic/game";
import { openShop } from "../logic/shop";
import { begin, cleared, TEST_TUNING, tick } from "../logic/testing";
import type { Game, ModuleId } from "../logic/types";
import { type Change, createSession } from "./session";

const seeds =
  (...values: number[]) =>
  () => {
    const seed = values.shift();
    if (seed === undefined) throw new Error("シードが足りない");
    return seed;
  };

describe("createSession", () => {
  test("最初はシードから始めたランの開始待ち", () => {
    expect(createSession(seeds(1)).store.getSnapshot()).toEqual(startRun(1));
  });

  test("方向を押して時間を進めると、ステージが始まる", () => {
    const session = createSession(seeds(1), TEST_TUNING);
    session.command({ kind: "direction", direction: "up" });
    session.advance(0);
    expect(session.store.getSnapshot()).toMatchObject({ phase: "playing", movement: { direction: "up" } });
  });

  test("押した方向は1回の進行でだけ使われる", () => {
    const session = createSession(seeds(1), TEST_TUNING);
    session.command({ kind: "direction", direction: "up" });
    session.advance(0);
    session.command({ kind: "direction", direction: "left" });
    session.advance(0);
    session.advance(CONFIG.moveIntervalMs);
    session.advance(CONFIG.moveIntervalMs);
    const game = session.store.getSnapshot();
    if (game.phase !== "playing") throw new Error(`ステージ中のはず: ${game.phase}`);
    expect(game.movement.queuedInputs).toEqual([]);
    expect(game.stage.body[0]).toEqual({ x: 5, y: 7 });
  });

  describe("調整した数値", () => {
    const short: Tuning = { ...DEFAULT_TUNING, config: { ...DEFAULT_TUNING.config, timeLimitMs: 2_000 } };
    const fast: Tuning = { ...DEFAULT_TUNING, config: { ...DEFAULT_TUNING.config, moveIntervalMs: 50 } };

    test("渡した数値で最初のランを始める", () => {
      expect(createSession(seeds(1), short).store.getSnapshot()).toEqual(startRun(1, { tuning: short }));
    });

    test("数値を指定して始め直すと、どの局面からでもその数値で新しいランになる", () => {
      const session = createSession(seeds(1, 2), short);
      session.command({ kind: "direction", direction: "up" });
      session.advance(0);
      session.restart(fast);
      expect(session.store.getSnapshot()).toEqual(startRun(2, { tuning: fast }));
    });
  });

  describe("調整パネル", () => {
    test("パネルを開くと、閉じるまで時間が進まず、方向の入力も受け付けない", () => {
      const session = createSession(seeds(1));
      session.command({ kind: "direction", direction: "up" });
      session.advance(0);
      const playing = session.store.getSnapshot();
      session.command({ kind: "togglePanel" });
      expect(session.view.getSnapshot().panelOpen).toBe(true);
      session.command({ kind: "direction", direction: "left" });
      session.advance(1_000);
      expect(session.store.getSnapshot()).toBe(playing);
      session.command({ kind: "togglePanel" });
      expect(session.view.getSnapshot().panelOpen).toBe(false);
      session.advance(0);
      const game = session.store.getSnapshot();
      if (game.phase !== "playing") throw new Error(game.phase);
      expect(game.movement.queuedInputs).toEqual([]);
    });

    test("始め直すとパネルが閉じる", () => {
      const session = createSession(seeds(1, 2));
      session.command({ kind: "togglePanel" });
      session.restart(DEFAULT_TUNING);
      expect(session.view.getSnapshot().panelOpen).toBe(false);
    });
  });

  describe("タイトル", () => {
    test("最初はタイトルにいて、新しいランを始めるとタイトルを出て、その数値で始め直す", () => {
      const session = createSession(seeds(1, 2), TEST_TUNING);
      expect(session.view.getSnapshot().onTitle).toBe(true);
      session.startNewRun();
      expect(session.view.getSnapshot().onTitle).toBe(false);
      expect(session.store.getSnapshot()).toEqual(startRun(2, { tuning: TEST_TUNING }));
    });

    test("タイトルへ戻ると、タイトルにいる", () => {
      const session = createSession(seeds(1, 2), TEST_TUNING);
      session.startNewRun();
      session.goToTitle();
      expect(session.view.getSnapshot().onTitle).toBe(true);
    });
  });

  describe("設定メニュー", () => {
    const playingSession = () => {
      const session = createSession(seeds(1), TEST_TUNING);
      session.command({ kind: "direction", direction: "up" });
      session.advance(0);
      return session;
    };

    test("ステージ中に開くと止まり、閉じても止まったまま", () => {
      const session = playingSession();
      session.command({ kind: "toggleMenu" });
      expect(session.view.getSnapshot().menuOpen).toBe(true);
      expect(session.store.getSnapshot().phase).toBe("paused");
      session.command({ kind: "toggleMenu" });
      expect(session.view.getSnapshot().menuOpen).toBe(false);
      session.advance(1_000);
      expect(session.store.getSnapshot().phase).toBe("paused");
    });

    test("開いているあいだは、方向キーも時間も無視する", () => {
      const session = playingSession();
      session.command({ kind: "toggleMenu" });
      const paused = session.store.getSnapshot();
      session.command({ kind: "direction", direction: "left" });
      session.advance(1_000);
      expect(session.store.getSnapshot()).toBe(paused);
      session.command({ kind: "toggleMenu" });
      session.advance(0);
      expect(session.store.getSnapshot().phase).toBe("paused");
      session.command({ kind: "direction", direction: "left" });
      session.advance(0);
      expect(session.store.getSnapshot()).toMatchObject({ phase: "playing", movement: { direction: "left" } });
    });

    test("ステージ中以外では、開いてもゲームは変わらない", () => {
      const game = cleared();
      const session = createSession(seeds(1), TEST_TUNING, () => game);
      session.command({ kind: "toggleMenu" });
      expect(session.view.getSnapshot().menuOpen).toBe(true);
      expect(session.store.getSnapshot()).toBe(game);
    });
  });

  describe("画面の操作", () => {
    const sessionAt = (game: Game) => createSession(seeds(1), DEFAULT_TUNING, () => game);
    const shopWith = (pp: number) => openShop(cleared({ pp })).game;
    const dying = (modules: readonly ModuleId[]) =>
      tick(begin("right", { walls: [{ x: 8, y: 7 }], hp: 1, modules })).game;

    test("クリアの局面でモジュールの画面を開ける", () => {
      const session = sessionAt(cleared());
      session.perform({ kind: "openShop" });
      expect(session.store.getSnapshot().phase).toBe("shop");
    });

    test("モジュールの画面で、候補を買える", () => {
      const session = sessionAt(shopWith(100));
      session.perform({ kind: "buy", offerIndex: 1 });
      const game = session.store.getSnapshot();
      if (game.phase !== "shop") throw new Error(game.phase);
      expect(game.offers.map((o) => o.sold)).toEqual([false, true, false]);
      expect(game.run.purchased).toEqual([game.offers[1]?.module]);
    });

    test("モジュールの画面で、リロールできる", () => {
      const session = sessionAt(shopWith(10));
      session.perform({ kind: "reroll" });
      expect(session.store.getSnapshot().run.pp).toBe(10 - CONFIG.rerollPrice);
    });

    test("モジュールの画面から次のステージへ進める", () => {
      const session = sessionAt(shopWith(0));
      session.perform({ kind: "nextStage" });
      expect(session.store.getSnapshot()).toMatchObject({ phase: "awaitingStart", run: { stageNumber: 2 } });
    });

    test("生き返るモーダルで、選んだモジュールで生き返る", () => {
      const session = sessionAt(dying(["revive", "reviveAtOneHp"]));
      session.perform({ kind: "revive", module: "reviveAtOneHp" });
      expect(session.store.getSnapshot()).toMatchObject({
        phase: "awaitingStart",
        run: { hp: 1, modules: ["revive"] },
      });
    });

    test("生き返るモーダルで諦めると、ゲームオーバー", () => {
      const session = sessionAt(dying(["revive"]));
      session.perform({ kind: "giveUp" });
      expect(session.store.getSnapshot()).toMatchObject({ phase: "gameOver", cause: "hp" });
    });

    test("その局面でできない操作は何も変えない", () => {
      const session = sessionAt(startRun(1));
      const before = session.store.getSnapshot();
      for (const action of [
        { kind: "openShop" },
        { kind: "buy", offerIndex: 0 },
        { kind: "nextStage" },
        { kind: "giveUp" },
      ] as const) {
        session.perform(action);
      }
      expect(session.store.getSnapshot()).toBe(before);
    });
  });

  describe("onChange", () => {
    const listen = (session: ReturnType<typeof createSession>) => {
      const changes: Change[] = [];
      session.onChange((change) => changes.push(change));
      return changes;
    };

    test("進めたときに、前の状態と次の状態とイベントを知らせる", () => {
      const prev = begin("right", { battery: { x: 8, y: 7 } });
      const session = createSession(seeds(1), TEST_TUNING, () => prev);
      const changes = listen(session);
      session.advance(CONFIG.moveIntervalMs);
      expect(changes).toEqual([
        { prev, next: session.store.getSnapshot(), events: [{ type: "batteryEaten", at: { x: 8, y: 7 } }] },
      ]);
    });

    test("画面の操作でも知らせる", () => {
      const prev = tick(begin("right", { walls: [{ x: 8, y: 7 }], hp: 1, modules: ["revive"] })).game;
      const session = createSession(seeds(1), TEST_TUNING, () => prev);
      const changes = listen(session);
      session.perform({ kind: "revive", module: "revive" });
      expect(changes).toEqual([{ prev, next: session.store.getSnapshot(), events: [{ type: "revived" }] }]);
    });

    test("始め直したときも、イベントなしで知らせる", () => {
      const session = createSession(seeds(1, 2), TEST_TUNING);
      const prev = session.store.getSnapshot();
      const changes = listen(session);
      session.restart(TEST_TUNING);
      expect(changes).toEqual([{ prev, next: session.store.getSnapshot(), events: [] }]);
    });

    test("やめたあとは知らせない", () => {
      const session = createSession(seeds(1, 2), TEST_TUNING);
      const changes: Change[] = [];
      const stop = session.onChange((change) => changes.push(change));
      stop();
      session.restart(TEST_TUNING);
      expect(changes).toEqual([]);
    });
  });
});
