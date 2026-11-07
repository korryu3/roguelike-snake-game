import type { Volumes } from "../audio/volume";
import { LANG_NAMES, LANGS, type Lang } from "../i18n/lang";
import type { Messages } from "../i18n/messages";

type Props = {
  readonly t: Messages;
  readonly volumes: Volumes;
  readonly lang: Lang;
  readonly onLangChange: (lang: Lang) => void;
  /** ステージ中に開いたときは「再開」、それ以外では「閉じる」 */
  readonly inStage: boolean;
  readonly onVolumesChange: (volumes: Volumes) => void;
  /** 効果音の音量を決めたあと、聞いて確かめられるように鳴らす */
  readonly onSfxPreview: () => void;
  readonly onClose: () => void;
};

export function SettingsMenu({ t, volumes, lang, onLangChange, inStage, onVolumesChange, onSfxPreview, onClose }: Props) {
  return (
    <div className="modal-backdrop">
      <section className="modal settings" role="dialog" aria-modal="true" aria-label={t.settings.title}>
        <h2 className="modal-title">{t.settings.title}</h2>
        <VolumeSlider label={t.settings.bgm} value={volumes.bgm} onChange={(bgm) => onVolumesChange({ ...volumes, bgm })} />
        <VolumeSlider
          label={t.settings.sfx}
          value={volumes.sfx}
          onChange={(sfx) => onVolumesChange({ ...volumes, sfx })}
          onCommit={onSfxPreview}
        />
        <div className="volume">
          <span className="volume-label">{t.language}</span>
          {/* 切り替えのボタンには、どちらの言語で遊んでいても、その言語自身の書き方で名前を出す */}
          <div className="lang-switch" role="group" aria-label={t.language}>
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                className={l === lang ? "button lang-current" : "button"}
                aria-pressed={l === lang}
                onClick={() => onLangChange(l)}
              >
                {LANG_NAMES[l]}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="button button-primary" autoFocus onClick={onClose}>
            {inStage ? t.settings.resume : t.settings.close}
          </button>
        </div>
      </section>
    </div>
  );
}

type SliderProps = {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly onCommit?: () => void;
};

function VolumeSlider({ label, value, onChange, onCommit }: SliderProps) {
  const percent = Math.round(value * 100);
  return (
    <label className="volume">
      <span className="volume-label">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
      />
      <span className="volume-value">{percent}%</span>
    </label>
  );
}
