import type { ReactNode } from "react"
import { X } from "lucide-react"

export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-deep/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="screen-in no-scrollbar max-h-[90%] w-full overflow-y-auto rounded-t-[28px] bg-paper px-5 pt-3 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line-strong" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-[20px] font-bold text-deep">{title}</h2>
          <button type="button" aria-label="סגירה" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-deep hover:bg-fill-2">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
