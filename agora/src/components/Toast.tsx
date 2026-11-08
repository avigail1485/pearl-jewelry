import { useUI } from "../store/ui";

export function Toast() {
  const t = useUI((s) => s.toast);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-gutter" style={{ top: "calc(12px + env(safe-area-inset-top))" }}>
      {t && <div className="scrim-enter rounded-full bg-ink px-5 py-3 text-body text-white">{t}</div>}
    </div>
  );
}
