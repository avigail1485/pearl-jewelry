import type { ReactNode } from "react"

export default function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lavender text-blue">{icon}</span>
      <h2 className="text-[18px] font-bold">{title}</h2>
      <p className="max-w-[280px] text-[14px] text-mute">{text}</p>
      {action}
    </div>
  )
}
