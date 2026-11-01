import type { ReactNode } from "react"

export default function Chip({ children, selected, onClick, icon }: { children: ReactNode; selected?: boolean; onClick?: () => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[14px] font-medium transition-colors ${
        selected ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-inset ring-line hover:ring-ink/30"
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
