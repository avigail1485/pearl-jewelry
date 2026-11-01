import type { ReactNode } from "react"

export const inputCls =
  "w-full rounded-2xl bg-lavender px-4 py-3.5 text-[15px] text-ink placeholder:text-mute outline-none ring-blue focus:bg-white focus:ring-2"

export default function Field({ label, htmlFor, hint, error, action, children }: { label: string; htmlFor?: string; hint?: ReactNode; error?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[14px] font-semibold text-ink">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-[#c2410c]">{error}</p>
      ) : (
        hint && <p className="text-[13px] text-mute">{hint}</p>
      )}
    </div>
  )
}
