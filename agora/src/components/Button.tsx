import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "neon" | "secondary" | "link";
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "sm";
  block?: boolean;
  icon?: ReactNode;
}

const styles: Record<Variant, string> = {
  primary: "bg-ink text-white",
  neon: "bg-neon text-ink",
  secondary: "bg-gray-100 text-ink",
  link: "bg-transparent text-ink underline underline-offset-4 decoration-1",
};

export function Button({ variant = "primary", size = "md", block, icon, className = "", children, ...rest }: Props) {
  const h = variant === "link" ? "min-h-[44px] px-2" : size === "md" ? "h-12 px-6" : "h-10 px-5 relative after:absolute after:-inset-y-[2px] after:inset-x-0";
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn font-demibold text-button transition-transform active:scale-[.98] disabled:opacity-40 disabled:active:scale-100 ${h} ${styles[variant]} ${block ? "w-full" : ""} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
