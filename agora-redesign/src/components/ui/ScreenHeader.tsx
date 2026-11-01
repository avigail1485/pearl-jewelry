import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { useNav } from "../../nav"

/** Consistent top bar with a clear back arrow (RTL: arrow points right = back). */
export default function ScreenHeader({ title, onBack, end }: { title?: string; onBack?: () => void; end?: ReactNode }) {
  const nav = useNav()
  return (
    <header className="safe-top sticky top-0 z-10 flex items-center gap-3 bg-ground/95 px-5 pb-3 backdrop-blur">
      <button
        type="button"
        onClick={onBack ?? nav.back}
        aria-label="חזרה"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper text-deep transition-colors hover:text-brand-strong active:scale-95"
        style={{ boxShadow: "var(--shadow-raised)" }}
      >
        <ArrowRight size={22} />
      </button>
      {title && <h1 className="font-display min-w-0 flex-1 truncate text-[20px] font-bold text-deep">{title}</h1>}
      {!title && <span className="flex-1" />}
      {end}
    </header>
  )
}
