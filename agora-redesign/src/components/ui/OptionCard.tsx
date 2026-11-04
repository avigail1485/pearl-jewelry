import type { ReactNode } from "react"
import { Check } from "lucide-react"

/** A large, fully tappable option card used for radio and checkbox choices. */
export default function OptionCard({ selected, onClick, title, note, icon, role = "radio" }: { selected: boolean; onClick: () => void; title: string; note?: string; icon?: ReactNode; role?: "radio" | "checkbox" }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-right transition-[background-color,box-shadow] duration-150 active:scale-[0.99] ${
        selected ? "bg-lavender ring-2 ring-inset ring-blue" : "bg-white ring-1 ring-inset ring-line hover:ring-ink/25"
      }`}
    >
      {icon && <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-blue text-white" : "bg-lavender text-ink-2"}`}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        {note && <span className="block text-[13px] text-ink-2">{note}</span>}
      </span>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${selected ? "bg-blue text-white" : "ring-1 ring-inset ring-line"}`} aria-hidden="true">
        {selected && <Check size={14} strokeWidth={3} />}
      </span>
    </button>
  )
}

