import type { ReactNode } from "react";
import { Illustration, type IllustrationName } from "./Illustration";

export function EmptyState({ name, size, title, text, children }: { name: IllustrationName; size: number; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-gutter py-8 text-center">
      <Illustration name={name} size={size} />
      <h2 className="mt-4 text-title font-demibold">{title}</h2>
      {text && <p className="mt-1 max-w-[300px] text-body">{text}</p>}
      {children && <div className="mt-6 flex w-full flex-col items-center gap-2">{children}</div>}
    </div>
  );
}
