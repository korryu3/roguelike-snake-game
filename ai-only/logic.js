export const W = 19;
export const H = 19;

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const START = { x: 9, y: 9 };
const START_LEN = 4;

export const PERKS = {
  heart: { name: '鉄の心臓', text: '最大HP+1、HPを1回復', apply: (s) => { s.maxHp += 1; s.hp = Math.min(s.maxHp, s.hp + 1); } },
  ghost: { name: '幽霊の尾', text: '自分の体をすり抜ける', unique: true, apply: (s) => { s.perks.ghost = true; } },
  breaker: { name: '岩砕きの牙', text: '壁を3回まで壊して進める', apply: (s) => { s.perks.breaker += 3; } },
  gourmet: { name: '美食家', text: '獲得スコア+50%', apply: (s) => { s.perks.mult += 0.5; } },
  slow: { name: '冬眠の血', text: '移動が少し遅くなる', apply: (s) => { s.perks.slow += 18; } },
  lucky: { name: '黄金の鼻', text: '金のリンゴが出やすくなる', apply: (s) => { s.perks.lucky += 0.15; } },
  mend: { name: '薬草', text: 'HPを全回復', apply: (s) => { s.hp = s.maxHp; } },
};

const key = (x, y) => `${x},${y}`;
const inBounds = (x, y) => x >= 0 && x < W && y >= 0 && y < H;

function rand(s) {
  s.rs = (s.rs + 0x6d2b79f5) | 0;
  let t = s.rs;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (s, n) => Math.floor(rand(s) * n);

export function isConnected(walls) {
  const free = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!walls.has(key(x, y))) free.push([x, y]);
  if (free.length === 0) return false;
  const seen = new Set([key(...free[0])]);
  const stack = [free[0]];
  while (stack.length) {
    const [x, y] = stack.pop();
    for (const [dx, dy] of Object.values(DIRS)) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (inBounds(nx, ny) && !walls.has(k) && !seen.has(k)) { seen.add(k); stack.push([nx, ny]); }
    }
  }
  return seen.size === free.length;
}

function occupied(s, x, y) {
  const k = key(x, y);
  return s.walls.has(k)
    || s.snake.some((p) => p.x === x && p.y === y)
    || s.food.some((f) => f.x === x && f.y === y)
    || s.enemies.some((e) => e.x === x && e.y === y)
    || (s.exit && s.exit.x === x && s.exit.y === y);
}

function freeCell(s, accept = () => true) {
  for (let i = 0; i < 2000; i++) {
    const x = randInt(s, W), y = randInt(s, H);
    if (!occupied(s, x, y) && accept(x, y)) return { x, y };
  }
  return null;
}

function spawnFood(s) {
  const cell = freeCell(s);
  if (cell) s.food.push({ ...cell, kind: rand(s) < 0.1 + s.perks.lucky ? 'gold' : 'apple' });
}

const inSafeZone = (x, y) => Math.abs(x - START.x) <= 1 && y >= START.y - 5 && y <= START.y + START_LEN + 1;

function buildFloor(s) {
  s.snake = Array.from({ length: START_LEN }, (_, i) => ({ x: START.x, y: START.y + i }));
  s.dir = 'up';
  s.queue = [];
  s.walls = new Set();
  s.food = [];
  s.enemies = [];
  s.exit = null;
  s.exitOpen = false;
  s.eaten = 0;
  s.need = 3 + s.floor;
  s.stunned = false;

  const segments = 5 + s.floor * 2;
  for (let i = 0; i < segments; i++) {
    const [dx, dy] = rand(s) < 0.5 ? [1, 0] : [0, 1];
    const len = 2 + randInt(s, 3);
    const x0 = randInt(s, W), y0 = randInt(s, H);
    const cells = [];
    for (let j = 0; j < len; j++) {
      const x = x0 + dx * j, y = y0 + dy * j;
      if (inBounds(x, y) && !inSafeZone(x, y)) cells.push(key(x, y));
    }
    const trial = new Set([...s.walls, ...cells]);
    if (isConnected(trial)) s.walls = trial;
  }

  s.exit = freeCell(s, (x, y) => Math.abs(x - START.x) + Math.abs(y - START.y) > 7);
  const enemyCount = Math.min(s.floor - 1, 6);
  for (let i = 0; i < enemyCount; i++) {
    const e = freeCell(s, (x, y) => Math.abs(x - START.x) + Math.abs(y - START.y) > 6);
    if (e) s.enemies.push(e);
  }
  spawnFood(s);
}

export function newRun(seed) {
  const s = {
    seed, rs: seed | 0, floor: 1, hp: 3, maxHp: 3, score: 0, tick: 0,
    perks: { ghost: false, breaker: 0, mult: 1, slow: 0, lucky: 0 },
    taken: [], phase: 'play', offer: [], grow: 0, flash: 0,
  };
  buildFloor(s);
  return s;
}

export const tickMs = (s) => Math.max(70, 150 - (s.floor - 1) * 7) + s.perks.slow;

function hurt(s) {
  s.hp -= 1;
  s.stunned = true;
  s.flash = 6;
  if (s.hp <= 0) s.phase = 'dead';
}

function moveEnemies(s) {
  const h = s.snake[0];
  for (const e of s.enemies) {
    const options = Object.values(DIRS)
      .map(([dx, dy]) => ({ x: e.x + dx, y: e.y + dy }))
      .filter(({ x, y }) => inBounds(x, y) && !s.walls.has(key(x, y))
        && !s.snake.some((p) => p.x === x && p.y === y)
        && !s.enemies.some((o) => o.x === x && o.y === y)
        && !(s.exit && s.exit.x === x && s.exit.y === y));
    if (options.length === 0) continue;
    const chase = rand(s) < Math.min(0.2 + s.floor * 0.06, 0.7);
    const dist = (p) => Math.abs(p.x - h.x) + Math.abs(p.y - h.y);
    const pick = chase
      ? options.reduce((a, b) => (dist(b) < dist(a) ? b : a))
      : options[randInt(s, options.length)];
    e.x = pick.x;
    e.y = pick.y;
  }
}

function offerPerks(s) {
  const pool = Object.keys(PERKS).filter((id) => !(PERKS[id].unique && s.taken.includes(id)));
  const offer = [];
  while (offer.length < 3 && pool.length) offer.push(pool.splice(randInt(s, pool.length), 1)[0]);
  return offer;
}

export function step(prev, input) {
  if (prev.phase !== 'play') return prev;
  const s = structuredClone(prev);
  s.tick += 1;
  if (s.flash > 0) s.flash -= 1;

  if (input && input !== OPPOSITE[s.dir]) {
    s.dir = input;
    s.stunned = false;
  }
  if (s.stunned) return s;

  const [dx, dy] = DIRS[s.dir];
  const nx = s.snake[0].x + dx, ny = s.snake[0].y + dy, nk = key(nx, ny);

  if (!inBounds(nx, ny)) { hurt(s); return s; }
  if (s.walls.has(nk)) {
    if (s.perks.breaker > 0) { s.perks.breaker -= 1; s.walls.delete(nk); }
    else { hurt(s); return s; }
  }
  const body = s.grow > 0 ? s.snake : s.snake.slice(0, -1);
  if (!s.perks.ghost && body.some((p) => p.x === nx && p.y === ny)) { hurt(s); return s; }
  const enemyIdx = s.enemies.findIndex((e) => e.x === nx && e.y === ny);
  if (enemyIdx >= 0) { s.enemies.splice(enemyIdx, 1); hurt(s); return s; }

  s.snake.unshift({ x: nx, y: ny });
  if (s.grow > 0) s.grow -= 1; else s.snake.pop();

  const foodIdx = s.food.findIndex((f) => f.x === nx && f.y === ny);
  if (foodIdx >= 0) {
    const [f] = s.food.splice(foodIdx, 1);
    s.grow += 1;
    s.eaten += 1;
    s.score += Math.round((f.kind === 'gold' ? 50 : 10) * s.perks.mult);
    if (f.kind === 'gold') s.hp = Math.min(s.maxHp, s.hp + 1);
    if (s.eaten >= s.need) s.exitOpen = true;
    spawnFood(s);
  }

  if (s.exitOpen && s.exit && s.exit.x === nx && s.exit.y === ny) {
    s.score += 100 * s.floor;
    s.phase = 'perk';
    s.offer = offerPerks(s);
    return s;
  }

  if (s.tick % 2 === 0) moveEnemies(s);
  return s;
}

export function choosePerk(prev, id) {
  if (prev.phase !== 'perk' || !prev.offer.includes(id)) return prev;
  const s = structuredClone(prev);
  PERKS[id].apply(s);
  s.taken.push(id);
  s.floor += 1;
  s.phase = 'play';
  s.offer = [];
  buildFloor(s);
  return s;
}
