import type { ReactNode } from "react"
import { X } from "lucide-react"

export default function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-ink/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-in flex max-h-[88%] w-full flex-col rounded-t-[28px] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <button type="button" aria-label="סגירה" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-lavender">
            <X size={20} />
          </button>
          <h2 className="text-[16px] font-bold">{title}</h2>
          <span className="w-9" />
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
