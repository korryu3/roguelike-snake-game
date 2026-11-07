import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  readonly title: string;
  readonly children: ReactNode;
  readonly className?: string;
};

/**
 * ゲームのモーダル。開いているかどうかはゲームの局面で決まるので、
 * Escや外側のクリックでは閉じない（設定メニューのEscは、セッションが受け取る）
 */
export function GameDialog({ title, children, className }: Props) {
  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className={cn(
          "flex max-h-[calc(100vh-2rem)] w-[min(760px,calc(100vw-2rem))] max-w-none flex-col items-center gap-4 overflow-y-auto border-2 border-panel-edge bg-card p-6 sm:max-w-none",
          className,
        )}
      >
        <DialogTitle className="text-2xl">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
