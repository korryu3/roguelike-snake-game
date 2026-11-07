import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSprites } from "./sprites";

type Props = Omit<ComponentProps<typeof Button>, "variant" | "size"> & {
  /** primaryは明るい枠（目立たせるボタン）、normalは暗い枠 */
  readonly tone?: "primary" | "normal";
  readonly size?: "game" | "hero";
};

/**
 * ゲームの画面のボタン。枠の画像があれば、角を崩さずに伸ばして（border-image）文字を上に載せる。
 * 画像がなければ、shadcn/uiのふつうのボタン
 */
export function GameButton({ tone = "primary", size = "game", className, style, ...props }: Props) {
  const { urls } = useSprites();
  const frame = tone === "primary" ? urls.buttonLight : urls.buttonDark;
  return (
    <Button
      variant={tone === "primary" ? "default" : "secondary"}
      size={size}
      className={cn(
        frame && "rounded-none border-solid bg-transparent hover:bg-transparent hover:brightness-110",
        className,
      )}
      style={
        frame
          ? {
              borderImage: `url(${frame}) 160 fill / ${size === "hero" ? 18 : 12}px stretch`,
              borderWidth: size === "hero" ? 18 : 12,
              ...style,
            }
          : style
      }
      {...props}
    />
  );
}
