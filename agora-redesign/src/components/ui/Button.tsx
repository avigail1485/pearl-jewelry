import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "soft" | "outline" | "ghost"
const variants: Record<Variant, string> = {
  primary: "bg-blue text-white hover:bg-blue-hover",
  soft: "bg-lavender text-blue-ink hover:bg-lavender-2",
  outline: "bg-white text-ink ring-1 ring-inset ring-line hover:ring-ink/30",
  ghost: "bg-transparent text-ink-2 hover:text-ink",
}

export default function Button({
  variant = "primary", block, icon, size = "lg", className = "", type = "button", children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean; icon?: ReactNode; size?: "md" | "lg" }) {
  return (
    <button
      type={type}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${
        size === "lg" ? "h-[52px] px-5 text-[16px]" : "h-11 px-4 text-[14px]"
      } ${variants[variant]} ${block ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
