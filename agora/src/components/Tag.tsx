import type { ReactNode } from "react";

export function Tag({ children, tone = "green", className = "" }: { children: ReactNode; tone?: "green" | "neon"; className?: string }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-meta ${tone === "neon" ? "bg-neon font-demibold" : "bg-green-100"} text-ink ${className}`}>
      {children}
    </span>
  );
}
