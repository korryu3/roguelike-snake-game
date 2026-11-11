import { useState } from "react";
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
  readonly onChange: (preferences: Preferences) => void;
  /** 効果音の音量を決めたあと、聞いて確かめられるように鳴らす */
  readonly onSfxPreview: () => void;
  readonly onClose: () => void;
  /** ステージ中だけ渡す。押すと、確かめてからランを終える */
  readonly onGiveUp?: () => void;
};

const ROW = "grid w-full grid-cols-[7em_1fr_3.5em] items-center gap-3";

export function SettingsMenu({ t, preferences, onChange, onSfxPreview, onClose, onGiveUp }: Props) {
  const { lang, volumes } = preferences;
  const setVolumes = (next: Partial<Preferences["volumes"]>) =>
    onChange({ ...preferences, volumes: { ...volumes, ...next } });
  return (
    <GameDialog
      title={t.settings.title}
      className="w-[min(420px,calc(100vw-2rem))]"
      actions={<MenuActions t={t} onClose={onClose} onGiveUp={onGiveUp} />}
    >
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
        {/* 設定の値を選ぶ切り替え。操作のボタン（閉じる・諦める）とは見た目を分け、スライダーと同じ幅に収める */}
        <div
          className="grid grid-cols-2 overflow-hidden rounded-md border border-border"
          role="group"
          aria-label={t.language}
        >
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={l === lang}
              className={cn(
                "px-2 py-1 text-sm transition-colors",
                l === lang
                  ? "bg-highlight font-bold text-background"
                  : "bg-secondary text-foreground/80 hover:brightness-125",
              )}
              onClick={() => onChange({ ...preferences, lang: l })}
            >
              {/* どちらの言語で遊んでいても、その言語自身の書き方で名前を出す */}
              {LANG_NAMES[l]}
            </button>
          ))}
        </div>
      </div>
    </GameDialog>
  );
}

type ActionsProps = {
  readonly t: Messages;
  readonly onClose: () => void;
  readonly onGiveUp?: (() => void) | undefined;
};

/** 「閉じる」と、ステージ中だけ「諦める」。諦めるとランが終わるので、押したらその場でもう一度確かめる */
function MenuActions({ t, onClose, onGiveUp }: ActionsProps) {
  const [confirming, setConfirming] = useState(false);
  if (onGiveUp && confirming) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="m-0">{t.settings.confirmGiveUp}</p>
        <div className="flex gap-3">
          <GameButton tone="normal" autoFocus onClick={() => setConfirming(false)}>
            {t.settings.keepPlaying}
          </GameButton>
          {/* ゲームオーバーの音が鳴るので、ボタンの音は鳴らさない */}
          <GameButton tone="normal" className="text-destructive" data-silent onClick={onGiveUp}>
            {t.settings.giveUp}
          </GameButton>
        </div>
      </div>
    );
  }
  return (
    <>
      <GameButton autoFocus onClick={onClose}>
        {t.settings.close}
      </GameButton>
      {onGiveUp && (
        <GameButton tone="normal" className="text-destructive" onClick={() => setConfirming(true)}>
          {t.settings.giveUp}
        </GameButton>
      )}
    </>
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
