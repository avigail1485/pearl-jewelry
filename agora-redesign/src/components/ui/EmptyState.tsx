import type { ReactNode } from "react"
import Illustration, { type IllustrationName } from "./Illustration"

export default function EmptyState({ icon, art, title, text, action }: { icon?: ReactNode; art?: IllustrationName; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {art ? <Illustration name={art} size={170} className="mb-2" /> : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lavender text-blue">{icon}</span>}
      <h2 className="text-[18px] font-bold">{title}</h2>
      <p className="max-w-[280px] text-[14px] text-mute">{text}</p>
      {action}
    </div>
  )
}
