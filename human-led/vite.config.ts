import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

/** 層の依存の向きを、lintで検査する。filesの層は、layersの層を読み込まない */
const forbidLayers = (files: string[], layers: string[], message: string) => {
  const patterns = layers.map((layer) => ({ group: [`../${layer}`, `../${layer}/*`], message }));
  const rule: ["error", { patterns: typeof patterns }] = ["error", { patterns }];
  return { files, rules: { "no-restricted-imports": rule } };
};

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  fmt: {
    printWidth: 120,
    ignorePatterns: ["dist", "**/*.md"],
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "react", "import"],
    categories: { correctness: "error", suspicious: "error" },
    ignorePatterns: ["dist"],
    // vp checkで型検査もする
    options: { typeAware: true, typeCheck: true },
    rules: {
      "react/react-in-jsx-scope": "off",
      "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
      // 型を使うルール。型の整理（zod）で直すときに戻す
      "typescript/no-unsafe-type-assertion": "off",
      "typescript/consistent-return": "off",
      "typescript/no-misused-spread": "off",
    },
    overrides: [
      forbidLayers(
        ["src/logic/**"],
        ["ui", "render", "audio", "loop", "tuning", "preferences", "i18n", "assets"],
        "ルール（logic）は、ほかの層に依存しない純関数に保つ",
      ),
      forbidLayers(
        ["src/loop/**"],
        ["ui", "render", "audio", "tuning", "preferences", "i18n"],
        "セッション（loop）は、画面や音や保存を知らない",
      ),
      forbidLayers(
        ["src/render/**"],
        ["ui", "audio", "loop", "tuning", "preferences", "i18n"],
        "盤面の描画（render）は、ゲームの状態だけを読む",
      ),
      forbidLayers(
        ["src/audio/**", "src/tuning/**", "src/preferences/**", "src/i18n/**"],
        ["ui", "render"],
        "画面の部品と描画には依存しない",
      ),
      {
        files: ["**/*.test.ts", "**/*.test.tsx", "src/logic/testing.ts"],
        rules: { "unicorn/consistent-function-scoping": "off" },
      },
    ],
  },
});
