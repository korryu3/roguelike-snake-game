import { createContext, useContext } from "react";
import type { Sprites } from "../render/loadSprites";

const SpritesContext = createContext<Sprites>({ urls: {}, images: {} });

export const SpritesProvider = SpritesContext.Provider;

/** 読み込めた素材の画像。ないものは図形や文字で代わりに出す */
export const useSprites = () => useContext(SpritesContext);
