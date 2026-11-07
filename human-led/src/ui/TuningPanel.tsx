import { type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DEFAULT_TUNING, MODULE_IDS, type Config, type ModuleSpec, type Tuning } from "../config";
import type { ModuleId, WallPattern, WallPatternIssue } from "../logic/types";
import { checkWallPattern } from "../logic/wallPatterns";
import { MESSAGES } from "../i18n/messages";
import { CONFIG_FIELDS, CONFIG_KEYS, FIELD_BY_PATH, MODULE_SPEC_FIELDS, type Rule, SPEC_KEYS } from "../tuning/fields";
import { parseTuningJson, satisfies, type TuningIssue } from "../tuning/parse";
import { patternFromText, patternToText } from "../tuning/patternText";

type Props = {
  readonly draft: Tuning;
  readonly running: Tuning;
  readonly saved: boolean;
  readonly onChange: (tuning: Tuning) => void;
  readonly onRestart: (tuning: Tuning) => void;
};

const GROUPS = [...new Set(CONFIG_KEYS.map((key) => CONFIG_FIELDS[key].group))];

const toJson = (tuning: Tuning) => JSON.stringify(tuning, null, 2);

const MODULE_ROW = "grid grid-cols-[1fr_56px_56px] items-center gap-2";
const HINT = "m-0 text-xs text-muted-foreground";
const NOTE = "m-0 text-xs text-gold";
const ACTIONS = "flex flex-wrap gap-2";
const MONO = "font-mono text-xs";

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex flex-col gap-1.5 rounded-lg border border-panel-edge px-2.5 py-2">
      <legend className="px-1 text-muted-foreground">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function TuningPanel({ draft, running, saved, onChange, onRestart }: Props) {
  // 既定値に戻す・読み込むで値が外から変わったら、入力途中の文字列ごと作り直す
  const [revision, setRevision] = useState(0);
  const [jsonText, setJsonText] = useState("");
  const [messages, setMessages] = useState<readonly string[]>([]);
  const jsonRef = useRef<HTMLTextAreaElement>(null);
  const hasPendingChanges = toJson(draft) !== toJson(running);

  const replace = (tuning: Tuning, notes: readonly string[]) => {
    onChange(tuning);
    setRevision((r) => r + 1);
    setMessages(notes);
  };
  const setConfig = (key: keyof Config, value: number) =>
    onChange({ ...draft, config: { ...draft.config, [key]: value } });
  const setSpec = (id: ModuleId, key: keyof ModuleSpec, value: number) =>
    onChange({ ...draft, modules: { ...draft.modules, [id]: { ...draft.modules[id], [key]: value } } });
  const setPattern = (index: number, pattern: WallPattern) =>
    onChange({ ...draft, wallPatterns: draft.wallPatterns.map((p, i) => (i === index ? pattern : p)) });
  // 追加と削除では並びが変わるので、入力途中の文字列ごと作り直す
  const addPattern = () => {
    const size = draft.config.boardSize;
    replace(
      { ...draft, wallPatterns: [...draft.wallPatterns, Array.from({ length: size }, () => ".".repeat(size))] },
      [],
    );
  };
  const removePattern = (index: number) =>
    replace({ ...draft, wallPatterns: draft.wallPatterns.filter((_, i) => i !== index) }, []);

  const exportJson = async () => {
    const text = toJson(draft);
    setJsonText(text);
    try {
      await navigator.clipboard.writeText(text);
      setMessages(["JSONをクリップボードにコピーした"]);
    } catch {
      setMessages(["クリップボードが使えない。下の欄を選択してコピーする"]);
      requestAnimationFrame(() => jsonRef.current?.select());
    }
  };
  const importJson = () => {
    const result = parseTuningJson(jsonText);
    if (result.ok) {
      replace(result.tuning, ["読み込んだ"]);
      return;
    }
    // 読み込めなければ、今の調整は変えない
    const reasons = result.reason === "notJson" ? ["JSONとして読めない"] : result.issues.map(describeIssue);
    setMessages(["読み込めなかった（今の調整は変えていない）", ...reasons]);
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 flex w-[min(380px,100vw)] flex-col gap-2.5 overflow-y-auto border-l-2 border-panel-edge bg-card p-4 font-tool text-[13px]"
      aria-label="調整パネル"
      data-silent
    >
      <header>
        <h2 className="m-0 text-lg">数値の調整</h2>
        <span className={HINT}>Tで閉じる。開いているあいだは止まる</span>
      </header>
      <div className={ACTIONS}>
        <Button size="sm" onClick={() => onRestart(draft)}>
          この数値で始め直す
        </Button>
        <Button size="sm" variant="secondary" onClick={() => replace(DEFAULT_TUNING, ["既定値に戻した"])}>
          既定値に戻す
        </Button>
      </div>
      <p className={cn(NOTE, !hasPendingChanges && "invisible")} aria-hidden={!hasPendingChanges}>
        今のランにはまだ反映していない
      </p>
      {!saved && <p className={NOTE}>この環境では保存できない。閉じると消える</p>}

      <div key={revision} className="flex flex-col gap-2.5">
        {GROUPS.map((group) => (
          <Group key={group} legend={group}>
            {CONFIG_KEYS.filter((key) => CONFIG_FIELDS[key].group === group).map((key) => (
              <div key={key} className="grid grid-cols-[1fr_88px] items-center gap-2">
                <Label htmlFor={`tuning-${key}`} className="text-[13px] font-normal">
                  {CONFIG_FIELDS[key].label}
                </Label>
                <NumberInput
                  id={`tuning-${key}`}
                  rule={CONFIG_FIELDS[key].rule}
                  value={draft.config[key]}
                  onCommit={(v) => setConfig(key, v)}
                />
              </div>
            ))}
          </Group>
        ))}
        <Group legend="モジュール">
          <div className={cn(MODULE_ROW, "text-xs text-muted-foreground")}>
            <span />
            {SPEC_KEYS.map((key) => (
              <span key={key}>{MODULE_SPEC_FIELDS[key].label}</span>
            ))}
          </div>
          {MODULE_IDS.map((id) => (
            <div key={id} className={MODULE_ROW}>
              <span>{MESSAGES.ja.modules[id].name}</span>
              {SPEC_KEYS.map((key) => (
                <NumberInput
                  key={key}
                  label={FIELD_BY_PATH.get(`modules.${id}.${key}`)?.label}
                  rule={MODULE_SPEC_FIELDS[key].rule}
                  value={draft.modules[id][key]}
                  onCommit={(v) => setSpec(id, key, v)}
                />
              ))}
            </div>
          ))}
        </Group>
        <Group legend="壁のパターン">
          <p className={HINT}>#が壁、.が床。ステージごとに、この中からランダムに1つ選ぶ</p>
          {draft.wallPatterns.map((pattern, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span>パターン{i + 1}</span>
                <Button
                  size="xs"
                  variant="secondary"
                  disabled={draft.wallPatterns.length <= 1}
                  onClick={() => removePattern(i)}
                >
                  削除
                </Button>
              </div>
              <PatternInput label={`パターン${i + 1}`} pattern={pattern} onCommit={(p) => setPattern(i, p)} />
            </div>
          ))}
          <div className={ACTIONS}>
            <Button size="sm" variant="secondary" onClick={addPattern}>
              パターンを追加
            </Button>
          </div>
        </Group>
      </div>

      <Group legend="JSON">
        <div className={ACTIONS}>
          <Button size="sm" variant="secondary" onClick={exportJson}>
            JSONを書き出す
          </Button>
          <Button size="sm" variant="secondary" onClick={importJson}>
            読み込む
          </Button>
        </div>
        <Textarea
          ref={jsonRef}
          className={cn(MONO, "min-h-36")}
          aria-label="JSON"
          spellCheck={false}
          value={jsonText}
          placeholder="書き出したJSONがここに出る。貼り付けて「読み込む」でも反映できる"
          onChange={(e) => setJsonText(e.target.value)}
        />
      </Group>
      {messages.length > 0 && (
        <ul className="m-0 pl-4.5 text-foreground/80">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function NumberInput({
  id,
  rule,
  value,
  onCommit,
  label,
}: {
  id?: string;
  rule: Rule;
  value: number;
  onCommit: (value: number) => void;
  label?: string;
}) {
  const [text, setText] = useState(String(value));
  const parsed = text.trim() === "" ? Number.NaN : Number(text);
  const valid = satisfies(rule, parsed);
  return (
    <Input
      id={id}
      type="number"
      className="h-7 px-1.5 text-[13px] tabular-nums"
      aria-label={label}
      aria-invalid={!valid}
      title={valid ? undefined : describeRule(rule)}
      min={rule.min}
      max={rule.max === Number.MAX_SAFE_INTEGER ? undefined : rule.max}
      step={rule.integer ? 1 : 0.01}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const next = Number(e.target.value);
        if (e.target.value.trim() !== "" && satisfies(rule, next)) onCommit(next);
      }}
    />
  );
}

const PATTERN_ISSUES: Readonly<Record<WallPatternIssue, string>> = {
  empty: "パターンが空",
  badChar: "#と.以外の文字がある",
  notRectangular: "行の長さがそろっていない",
  blocksCenter: "中央のマスかそのまわりに壁がある",
};

function PatternInput({
  label,
  pattern,
  onCommit,
}: {
  label: string;
  pattern: WallPattern;
  onCommit: (pattern: WallPattern) => void;
}) {
  const [text, setText] = useState(patternToText(pattern));
  const issue = checkWallPattern(patternFromText(text));
  return (
    <>
      <Textarea
        className={cn(
          MONO,
          "min-h-0 leading-[1.1] tracking-[0.3em] [field-sizing:fixed] whitespace-pre overflow-x-auto",
        )}
        aria-label={label}
        aria-invalid={issue !== null}
        spellCheck={false}
        rows={Math.max(pattern.length, 3)}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const next = patternFromText(e.target.value);
          if (checkWallPattern(next) === null) onCommit(next);
        }}
      />
      {issue && <p className="m-0 text-xs text-destructive">{PATTERN_ISSUES[issue]}。直すまで反映しない</p>}
    </>
  );
}

function describeRule(rule: Rule): string {
  const range = rule.max === Number.MAX_SAFE_INTEGER ? `${rule.min}以上` : `${rule.min}〜${rule.max}`;
  return `${range}の${rule.integer ? "整数" : "数"}にする`;
}

function describeIssue(issue: TuningIssue): string {
  if (issue.kind === "unknown") return `知らない項目: ${issue.path}`;
  if (issue.path === "") return "一番外が { } のオブジェクトではない";
  if (issue.path === "wallPatterns") return "壁のパターンは、1つ以上のパターンの配列にする";
  const pattern = /^wallPatterns\.(\d+)$/.exec(issue.path);
  if (pattern) return `${Number(pattern[1]) + 1}番目の壁のパターンが使えない`;
  const field = FIELD_BY_PATH.get(issue.path);
  return field ? `${field.label}: ${describeRule(field.rule)}` : `${issue.path}: { } のオブジェクトにする`;
}
