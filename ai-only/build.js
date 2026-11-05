import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const IMPORT_LOGIC = /^import \{[^}]+\} from '\.\/logic\.js';$/m;

export function bundle(html, logic) {
  if (!IMPORT_LOGIC.test(html)) throw new Error('index.htmlにlogic.jsのimport文が見つからない');
  const inlined = html.replace(IMPORT_LOGIC, () => logic.replace(/^export /gm, ''));
  return '<!doctype html>\n<html lang="ja">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + inlined + '\n</html>\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = bundle(readFileSync('index.html', 'utf8'), readFileSync('logic.js', 'utf8'));
  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/snake.html', out);
  console.log('dist/snake.html');
}
