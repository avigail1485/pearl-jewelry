import type { ReactNode } from "react"

type ChipProps = {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  icon?: ReactNode
  as?: "button" | "span"
}

export default function Chip({ children, selected, onClick, icon, as = "button" }: ChipProps) {
  const cls = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] px-4 py-2 text-[14px] font-medium transition-all duration-200 min-h-[40px] ${
    selected ? "bg-brand text-paper" : "bg-paper text-deep hover:bg-brand-tint"
  }`
  const style = selected ? undefined : { boxShadow: "var(--shadow-raised)" }
  if (as === "span") {
    return (
      <span className={cls} style={style}>
        {icon}
        {children}
      </span>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cls} style={style}>
      {icon}
      {children}
    </button>
  )
}
