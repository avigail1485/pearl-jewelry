import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "accent" | "secondary" | "ghost"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  block?: boolean
  icon?: ReactNode
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none"

const variants: Record<Variant, string> = {
  primary: "bg-brand text-paper hover:bg-brand-hover",
  accent: "bg-accent text-paper hover:bg-accent-hover",
  secondary: "bg-paper text-deep hover:bg-surface",
  ghost: "bg-transparent text-ink-soft hover:text-brand-strong",
}

export default function Button({ variant = "primary", block = false, icon, children, className = "", style, type = "button", ...rest }: ButtonProps) {
  const shadow = variant === "secondary" ? { boxShadow: "var(--shadow-raised)", ...style } : style
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${block ? "w-full" : ""} h-[52px] px-5 text-[17px] ${className}`}
      style={shadow}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
