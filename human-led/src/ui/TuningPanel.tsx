import { useRef, useState } from "react";
import { DEFAULT_TUNING, MODULE_IDS, type Config, type ModuleSpec, type Tuning } from "../config";
import type { ModuleId } from "../logic/types";
import { CONFIG_FIELDS, CONFIG_KEYS, FIELD_BY_PATH, MODULE_LABELS, MODULE_SPEC_FIELDS, type Rule, SPEC_KEYS } from "../tuning/fields";
import { parseTuningJson, satisfies, type TuningIssue } from "../tuning/parse";

type Props = {
  readonly draft: Tuning;
  readonly running: Tuning;
  readonly saved: boolean;
  readonly onChange: (tuning: Tuning) => void;
  readonly onRestart: (tuning: Tuning) => void;
};

const GROUPS = [...new Set(CONFIG_KEYS.map((key) => CONFIG_FIELDS[key].group))];

const toJson = (tuning: Tuning) => JSON.stringify(tuning, null, 2);

export function TuningPanel({ draft, running, saved, onChange, onRestart }: Props) {
  // 既定値に戻す・読み込むで値が外から変わったら、入力途中の文字列ごと作り直す
  const [revision, setRevision] = useState(0);
  const [jsonText, setJsonText] = useState("");
  const [messages, setMessages] = useState<readonly string[]>([]);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const replace = (tuning: Tuning, notes: readonly string[]) => {
    onChange(tuning);
    setRevision((r) => r + 1);
    setMessages(notes);
  };
  const setConfig = (key: keyof Config, value: number) => onChange({ ...draft, config: { ...draft.config, [key]: value } });
  const setSpec = (id: ModuleId, key: keyof ModuleSpec, value: number) =>
    onChange({ ...draft, modules: { ...draft.modules, [id]: { ...draft.modules[id], [key]: value } } });

  const exportJson = async () => {
    const text = toJson(draft);
    setJsonText(text);
    try {
      await navigator.clipboard.writeText(text);
      setMessages(["JSONをクリップボードにコピーした"]);
    } catch {
      setMessages(["クリップボードが使えない。下の欄を選択してコピーしてください"]);
      requestAnimationFrame(() => jsonRef.current?.select());
    }
  };
  const importJson = () => {
    const result = parseTuningJson(jsonText);
    if (!result.ok) {
      setMessages([result.reason === "notJson" ? "JSONとして読めない" : "一番外が { } のオブジェクトではない"]);
      return;
    }
    replace(result.tuning, ["読み込んだ", ...result.issues.map(describeIssue)]);
  };

  return (
    <aside className="tuning" aria-label="調整パネル">
      <header className="tuning-header">
        <h2>数値の調整</h2>
        <span className="tuning-hint">Tで閉じる。開いているあいだは止まる</span>
      </header>
      <div className="tuning-actions">
        <button type="button" className="tuning-primary" onClick={() => onRestart(draft)}>
          この数値で始め直す
        </button>
        <button type="button" onClick={() => replace(DEFAULT_TUNING, ["既定値に戻した"])}>
          既定値に戻す
        </button>
      </div>
      {toJson(draft) !== toJson(running) && <p className="tuning-note">今のランにはまだ反映していない</p>}
      {!saved && <p className="tuning-note">この環境では保存できない。閉じると消える</p>}

      <div key={revision}>
        {GROUPS.map((group) => (
          <fieldset key={group} className="tuning-group">
            <legend>{group}</legend>
            {CONFIG_KEYS.filter((key) => CONFIG_FIELDS[key].group === group).map((key) => (
              <label key={key} className="tuning-field">
                <span>{CONFIG_FIELDS[key].label}</span>
                <NumberInput rule={CONFIG_FIELDS[key].rule} value={draft.config[key]} onCommit={(v) => setConfig(key, v)} />
              </label>
            ))}
          </fieldset>
        ))}
        <fieldset className="tuning-group">
          <legend>モジュール</legend>
          <div className="tuning-module tuning-module-head">
            <span />
            {SPEC_KEYS.map((key) => (
              <span key={key}>{MODULE_SPEC_FIELDS[key].label}</span>
            ))}
          </div>
          {MODULE_IDS.map((id) => (
            <div key={id} className="tuning-module">
              <span>{MODULE_LABELS[id]}</span>
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
        </fieldset>
      </div>

      <fieldset className="tuning-group">
        <legend>JSON</legend>
        <div className="tuning-actions">
          <button type="button" onClick={exportJson}>
            JSONを書き出す
          </button>
          <button type="button" onClick={importJson}>
            読み込む
          </button>
        </div>
        <textarea
          ref={jsonRef}
          className="tuning-json"
          aria-label="JSON"
          spellCheck={false}
          value={jsonText}
          placeholder="書き出したJSONがここに出る。貼り付けて「読み込む」でも反映できる"
          onChange={(e) => setJsonText(e.target.value)}
        />
      </fieldset>
      {messages.length > 0 && (
        <ul className="tuning-messages">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function NumberInput({ rule, value, onCommit, label }: { rule: Rule; value: number; onCommit: (value: number) => void; label?: string }) {
  const [text, setText] = useState(String(value));
  const parsed = text.trim() === "" ? Number.NaN : Number(text);
  const valid = satisfies(rule, parsed);
  return (
    <input
      type="number"
      className={valid ? "tuning-input" : "tuning-input tuning-invalid"}
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

function describeRule(rule: Rule): string {
  const range = rule.max === Number.MAX_SAFE_INTEGER ? `${rule.min}以上` : `${rule.min}〜${rule.max}`;
  return `${range}の${rule.integer ? "整数" : "数"}にする`;
}

function describeIssue(issue: TuningIssue): string {
  if (issue.kind === "unknown") return `知らない項目なので無視した: ${issue.path}`;
  const field = FIELD_BY_PATH.get(issue.path);
  return field ? `${field.label}は使えない値なので既定値にした（${describeRule(field.rule)}）` : `${issue.path}は使えない値なので既定値にした`;
}
