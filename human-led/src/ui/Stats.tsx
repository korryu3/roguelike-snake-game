import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 名前と値を2列に並べる成績の表 */
export function Stats({ children }: { children: ReactNode }) {
  return <dl className="m-0 grid grid-cols-[auto_auto] gap-x-6 gap-y-1.5 text-lg tabular-nums">{children}</dl>;
}

export function Stat({ label, children, sub = false }: { label: string; children: ReactNode; sub?: boolean }) {
  return (
    <>
      <dt className={cn("text-muted-foreground", sub && "pl-4 text-[15px]")}>{label}</dt>
      <dd className={cn("m-0 text-right", sub && "text-[15px]")}>{children}</dd>
    </>
  );
}
