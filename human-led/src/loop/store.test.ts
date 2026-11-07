import { describe, expect, test, vi } from "vite-plus/test";
import { createStore } from "./store";

describe("createStore", () => {
  test("作った直後は、初期値を返す", () => {
    expect(createStore(1).getSnapshot()).toBe(1);
  });

  test("値を変えると、新しい値を返し、購読者に知らせる", () => {
    const store = createStore(1);
    const listener = vi.fn();
    store.subscribe(listener);
    store.set(2);
    expect(store.getSnapshot()).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("同じ値を入れても、購読者に知らせない", () => {
    const store = createStore(1);
    const listener = vi.fn();
    store.subscribe(listener);
    store.set(1);
    expect(listener).not.toHaveBeenCalled();
  });

  test("購読をやめた購読者には知らせない", () => {
    const store = createStore(1);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.set(2);
    expect(listener).not.toHaveBeenCalled();
  });
});
