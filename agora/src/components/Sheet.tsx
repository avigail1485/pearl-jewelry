import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props { open: boolean; onClose: () => void; children: ReactNode; label: string; tall?: boolean }

export function Sheet({ open, onClose, children, label, tall }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const sc = document.getElementById("scroll-root");
    if (sc) sc.style.overflow = "hidden";
    ref.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); if (sc) sc.style.overflow = ""; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="absolute inset-0 z-50 flex items-end justify-center">
      <div className="scrim-enter absolute inset-0" style={{ background: "rgba(30,30,30,.4)" }} onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`sheet-enter relative w-full max-w-app rounded-t-sheet bg-white pb-safe ${tall ? "max-h-[92%]" : "max-h-[88%]"} flex flex-col`}
      >
        <div className="flex justify-center pt-3 pb-2"><span className="h-1 w-10 rounded-full bg-placeholder" /></div>
        <div className="overflow-y-auto px-gutter pb-6">{children}</div>
      </div>
    </div>,
    document.getElementById("app-frame") ?? document.body,
  );
}
