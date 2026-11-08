import { useRef, type ReactNode } from "react";
import { usePopIn } from "../lib/motion";
import { Illustration, type IllustrationName } from "./Illustration";

export function EmptyState({ name, size, title, text, children }: { name: IllustrationName; size: number; title: string; text?: string; children?: ReactNode }) {
  const art = useRef<HTMLDivElement>(null);
  usePopIn(art, [name]);
  return (
    <div className="flex w-full flex-col items-center px-gutter py-8 text-center">
      <div ref={art}><Illustration name={name} size={size} /></div>
      <h2 className="mt-4 text-title font-demibold">{title}</h2>
      {text && <p className="mt-1 max-w-[300px] text-body">{text}</p>}
      {children && <div className="mt-6 flex w-full flex-col items-center gap-2">{children}</div>}
    </div>
  );
}
