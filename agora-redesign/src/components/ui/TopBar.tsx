import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { useNav } from "../../nav"

/** Screen header with a consistent back arrow (RTL: points right). */
export default function TopBar({ title, onBack, end, children }: { title?: string; onBack?: () => void; end?: ReactNode; children?: ReactNode }) {
  const nav = useNav()
  return (
    <header className="pt-safe sticky top-0 z-20 flex items-center gap-2 bg-white/95 px-4 pb-3 shadow-header backdrop-blur">
      <button type="button" onClick={onBack ?? nav.back} aria-label="חזרה" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-lavender">
        <ArrowRight size={22} />
      </button>
      {children ?? <h1 className="min-w-0 flex-1 truncate text-[18px] font-bold">{title}</h1>}
      {end}
    </header>
  )
}
