import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, step, choosePerk, W, H, isConnected } from './logic.js';

const head = (s) => s.snake[0];
const clearBoard = (s) => {
  s.walls = new Set();
  s.food = [];
  s.enemies = [];
  return s;
};

test('前進すると頭が1マス進み長さは変わらない', () => {
  const s = clearBoard(newRun(1));
  const { x, y } = head(s);
  const len = s.snake.length;
  const n = step(s, null);
  assert.deepEqual(head(n), { x, y: y - 1 });
  assert.equal(n.snake.length, len);
});

test('真逆への方向転換は無視される', () => {
  const s = clearBoard(newRun(1));
  const { x, y } = head(s);
  const n = step(s, 'down');
  assert.deepEqual(head(n), { x, y: y - 1 });
});

test('餌を食べると伸びてスコアが入る', () => {
  const s = clearBoard(newRun(1));
  const { x, y } = head(s);
  s.food = [{ x, y: y - 1, kind: 'apple' }];
  const a = step(s, null);
  assert.equal(a.score, 10);
  assert.equal(a.eaten, 1);
  const b = step(a, null);
  assert.equal(b.snake.length, s.snake.length + 1);
});

test('壁にぶつかるとHPが減り、動かずに気絶する', () => {
  const s = clearBoard(newRun(1));
  const { x, y } = head(s);
  s.walls.add(`${x},${y - 1}`);
  const n = step(s, null);
  assert.equal(n.hp, s.hp - 1);
  assert.equal(n.stunned, true);
  assert.deepEqual(head(n), { x, y });
  assert.deepEqual(head(step(n, null)), { x, y }, '入力があるまで止まる');
  assert.deepEqual(head(step(n, 'left')), { x: x - 1, y });
});

test('HPが0になるとゲームオーバー', () => {
  const s = clearBoard(newRun(1));
  s.hp = 1;
  const { x, y } = head(s);
  s.walls.add(`${x},${y - 1}`);
  assert.equal(step(s, null).phase, 'dead');
});

test('壁砕きのチャージがあれば壁を壊して進む', () => {
  const s = clearBoard(newRun(1));
  s.perks.breaker = 1;
  const { x, y } = head(s);
  s.walls.add(`${x},${y - 1}`);
  const n = step(s, null);
  assert.deepEqual(head(n), { x, y: y - 1 });
  assert.equal(n.perks.breaker, 0);
  assert.equal(n.walls.has(`${x},${y - 1}`), false);
});

test('開いた出口に入ると強化を選び、次の階へ進む', () => {
  const s = clearBoard(newRun(1));
  const { x, y } = head(s);
  s.exit = { x, y: y - 1 };
  s.exitOpen = true;
  const n = step(s, null);
  assert.equal(n.phase, 'perk');
  assert.equal(n.offer.length, 3);
  const next = choosePerk(n, n.offer[0]);
  assert.equal(next.phase, 'play');
  assert.equal(next.floor, 2);
});

test('生成された階は空きマスが全てつながり、シードで再現する', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const s = newRun(seed);
    assert.ok(isConnected(s.walls), `seed ${seed}`);
    assert.deepEqual([...newRun(seed).walls], [...s.walls]);
    assert.ok(s.exit.x >= 0 && s.exit.x < W && s.exit.y >= 0 && s.exit.y < H);
  }
});
