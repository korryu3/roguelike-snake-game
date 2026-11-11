import { type ReactNode, useState } from "react";
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
      <Actions t={t} onClose={onClose} onGiveUp={onGiveUp} />
    </GameDialog>
  );
}

type ActionsProps = {
  readonly t: Messages;
  readonly onClose: () => void;
  readonly onGiveUp?: (() => void) | undefined;
};

/** 「閉じる」と、ステージ中だけ「諦める」を並べる。諦めるとランが終わるので、押したらその場でもう一度確かめる */
function Actions({ t, onClose, onGiveUp }: ActionsProps) {
  const [confirming, setConfirming] = useState(false);
  if (onGiveUp && confirming) {
    return (
      <ActionRow>
        {/* 問いかけは、答えのボタン2つの真ん中に置く */}
        <div className="flex flex-col items-center gap-2">
          <p className="m-0">{t.settings.confirmGiveUp}</p>
          <div className="flex gap-2">
            <GameButton tone="normal" autoFocus onClick={() => setConfirming(false)}>
              {t.settings.keepPlaying}
            </GameButton>
            {/* ゲームオーバーの音が鳴るので、ボタンの音は鳴らさない */}
            <GameButton tone="normal" className="text-destructive" data-silent onClick={onGiveUp}>
              {t.settings.giveUp}
            </GameButton>
          </div>
        </div>
      </ActionRow>
    );
  }
  const close = (
    <GameButton autoFocus onClick={onClose}>
      {t.settings.close}
    </GameButton>
  );
  // 「閉じる」だけのとき（タイトル・ゲームオーバー）は、ダイアログの真ん中に置く
  if (!onGiveUp) return <div className="flex justify-center">{close}</div>;
  return (
    <ActionRow>
      <div className="flex gap-2">
        {close}
        <GameButton tone="normal" className="text-destructive" onClick={() => setConfirming(true)}>
          {t.settings.giveUp}
        </GameButton>
      </div>
    </ActionRow>
  );
}

/** 上の設定の行と同じ列に入れ、言語のボタンと左端をそろえる */
function ActionRow({ children }: { children: ReactNode }) {
  return (
    <div className={ROW}>
      <span />
      <div className="col-span-2 flex flex-col items-start gap-2">{children}</div>
    </div>
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
