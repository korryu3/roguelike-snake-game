/**
 * キーの型を保ったまま、オブジェクトのキーを並べる。Object.keysはstring[]を返すので、型を付け直す場所をここに集める。
 * 渡すのは、型どおりのキーだけを持つオブジェクト（余分なキーを持たない定数）に限る。
 */
export function keysOf<T extends object>(record: T): (keyof T & string)[] {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 余分なキーを持たない定数だけを渡す前提
  return Object.keys(record) as (keyof T & string)[];
}

/** キーの一覧から、キーごとに値を作ったオブジェクトを組み立てる */
export function recordOf<K extends string, V>(keys: readonly K[], valueOf: (key: K) => V): Record<K, V> {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- keysの全部を、ちょうど1回ずつ埋めている
  return Object.fromEntries(keys.map((key) => [key, valueOf(key)])) as Record<K, V>;
}
