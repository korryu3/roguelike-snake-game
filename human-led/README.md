# ログスネ（human-led）

人間がコンセプトとルールを決め、AIに実装させたローグライク風スネーク。ルールは[docs/concept.md](./docs/concept.md)、決めた理由は[docs/discussions/](./docs/discussions/)を参照する。

## 開発の始め方

開発の道具は[Vite+](https://viteplus.dev/)（`vp`コマンド）にまとめている。nodeとpnpmの版は`package.json`の`devEngines`と`packageManager`で決めている。

1. `vp`を入れる（macOSならHomebrew）

   ```sh
   brew tap voidzero-dev/vite-plus https://github.com/voidzero-dev/vite-plus
   brew install voidzero-dev/vite-plus/vp
   ```

2. このフォルダで依存を入れる

   ```sh
   vp install
   ```

## よく使うコマンド

| コマンド | すること |
|---|---|
| `vp dev` | 開発用のサーバーを起動する |
| `vp check` | 整形の検査、lint、型検査 |
| `vp test` | テスト |
| `vp fmt` | 整形する |
| `vp build` | `dist/index.html`（1つのHTMLにまとめたもの）を作る |

PRを出すと、CIで`vp check`、`vp test run`、`vp build`が走る。mainにマージすると、GitHub Pagesに公開される。

## 数値の調整

遊んでいるときにTキーを押すと、数値の調整パネルが開く。制限時間や盤面の大きさ、モジュールの値段、壁のパターンを変えられ、JSONで書き出してほかの人と共有できる。変えた値はブラウザに保存され、「既定値に戻す」で元に戻る。
