import type { ReactNode } from "react"

type FieldProps = {
  label: string
  htmlFor?: string
  hint?: ReactNode
  error?: string
  badge?: ReactNode
  action?: ReactNode
  children: ReactNode
}

export const inputCls =
  "w-full rounded-[18px] bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand shadow-[var(--shadow-inset)]"

export default function Field({ label, htmlFor, hint, error, badge, action, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          {label}
          {badge}
        </label>
        {action}
      </div>
      {children}
      {hint && !error && <p className="text-[13px] leading-tight text-mute">{hint}</p>}
      {error && (
        <p role="alert" className="text-[13px] font-medium leading-tight text-accent-ink">
          {error}
        </p>
      )}
    </div>
  )
}
