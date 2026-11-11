import type { SpriteImages } from "./draw";
import { keysOf } from "../lib/records";
import { type SpriteKey, spriteUrls, type SpriteUrls } from "./sprites";

/*
 * 置いてある画像だけを読み込む。まだない画像（ゴールなど）は一覧に入らず、図形や文字で代わりに出す。
 * import.meta.globには文字列しか書けないので、ここの名前はSPRITE_FILESとそろえる（テストで確かめる）。
 * 名前を並べるのは、使わない画像（大きな1枚絵など）を単一HTMLに埋め込まないため。
 */
const FOUND = import.meta.glob<string>(
  "../assets/images/{battery,button-dark,button-light,double-battery,floor-center,floor-dark,floor-light,goal,heart,heart-damaged,module-body-cut,module-double-pp-and-growth,module-extra-module-choice,module-faster-movement,module-max-hp,module-revive,module-revive-partial,module-slower-movement,module-time-limit-boost,module-time-limit-plus,module-wall-immunity,progress-empty,progress-full,snake-body-1,snake-body-2,snake-head,wall,wall-top}.png",
  { eager: true, import: "default", query: "?url" },
);

export type Sprites = { readonly urls: SpriteUrls; readonly images: SpriteImages };

/** 画像をデコードし終えてから返す。読み込めない画像は、ないものとして扱う */
export async function loadSprites(): Promise<Sprites> {
  const urls = spriteUrls(FOUND);
  const images: Partial<Record<SpriteKey, HTMLImageElement>> = {};
  await Promise.all(
    keysOf(urls).map(async (key) => {
      const image = new Image();
      image.src = urls[key] ?? "";
      try {
        await image.decode();
        images[key] = image;
      } catch {
        // 読み込めない画像は、ないものとして図形で描く
      }
    }),
  );
  return { urls, images };
}
