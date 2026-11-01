import { CheckCircle2, Circle, Wrench, PackageCheck } from "lucide-react"
import type { Condition } from "../../data/mock"

// Status tags never rely on color alone — each carries an icon + text.
export function ConditionTag({ condition }: { condition: Condition }) {
  const map = {
    "כמו חדש": { Icon: CheckCircle2, cls: "bg-brand-tint text-brand-ink" },
    "במצב טוב": { Icon: Circle, cls: "bg-paper text-ink-soft" },
    "דורש תיקון": { Icon: Wrench, cls: "bg-accent-tint text-accent-ink" },
  } as const
  const { Icon, cls } = map[condition]
  return (
    <span className={`inline-flex items-center gap-1 rounded-[var(--radius-chip)] px-2 py-0.5 text-[12px] font-semibold ${cls}`}>
      <Icon size={12} strokeWidth={2.25} />
      {condition}
    </span>
  )
}

export function GivenBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-[var(--radius-chip)] bg-deep/85 px-2.5 py-1 text-[13px] font-semibold text-paper">
      <PackageCheck size={14} strokeWidth={2} />
      נמסר
    </span>
  )
}
