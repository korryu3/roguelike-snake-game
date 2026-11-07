import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { LANG_NAMES, LANGS } from "../i18n/lang";
import type { Messages } from "../i18n/messages";
import type { Preferences } from "../preferences/storage";
import { GameButton } from "./GameButton";
import { GameDialog } from "./GameDialog";

type Props = {
  readonly t: Messages;
  readonly preferences: Preferences;
  /** 閉じたらステージに戻るときは「再開」、それ以外では「閉じる」 */
  readonly returnsToStage: boolean;
  readonly onChange: (preferences: Preferences) => void;
  /** 効果音の音量を決めたあと、聞いて確かめられるように鳴らす */
  readonly onSfxPreview: () => void;
  readonly onClose: () => void;
};

const ROW = "grid w-full grid-cols-[7em_1fr_3.5em] items-center gap-3";

export function SettingsMenu({ t, preferences, returnsToStage, onChange, onSfxPreview, onClose }: Props) {
  const { lang, volumes } = preferences;
  const setVolumes = (next: Partial<Preferences["volumes"]>) =>
    onChange({ ...preferences, volumes: { ...volumes, ...next } });
  return (
    <GameDialog title={t.settings.title} className="w-[min(420px,calc(100vw-2rem))]">
      <VolumeSlider
        id="volume-bgm"
        label={t.settings.bgm}
        value={volumes.bgm}
        onChange={(bgm) => setVolumes({ bgm })}
      />
      <VolumeSlider
        id="volume-sfx"
        label={t.settings.sfx}
        value={volumes.sfx}
        onChange={(sfx) => setVolumes({ sfx })}
        onCommit={onSfxPreview}
      />
      <div className={ROW}>
        <span>{t.language}</span>
        {/* 切り替えのボタンには、どちらの言語で遊んでいても、その言語自身の書き方で名前を出す */}
        <div className="flex gap-2" role="group" aria-label={t.language}>
          {LANGS.map((l) => (
            <GameButton
              key={l}
              tone="normal"
              className={cn(l === lang && "border-highlight text-highlight")}
              aria-pressed={l === lang}
              onClick={() => onChange({ ...preferences, lang: l })}
            >
              {LANG_NAMES[l]}
            </GameButton>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-3">
        <GameButton autoFocus onClick={onClose}>
          {returnsToStage ? t.settings.resume : t.settings.close}
        </GameButton>
      </div>
    </GameDialog>
  );
}

type SliderProps = {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly onCommit?: () => void;
};

function VolumeSlider({ id, label, value, onChange, onCommit }: SliderProps) {
  const percent = Math.round(value * 100);
  return (
    <div className={ROW}>
      <Label htmlFor={id} className="text-base">
        {label}
      </Label>
      <Slider
        id={id}
        aria-label={label}
        min={0}
        max={100}
        step={1}
        value={[percent]}
        onValueChange={([next = percent]) => onChange(next / 100)}
        onValueCommit={onCommit}
      />
      <span className="text-right tabular-nums">{percent}%</span>
    </div>
  );
}
