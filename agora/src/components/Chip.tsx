import type { ReactNode } from "react";

export function Chip({ selected, onClick, children, icon }: { selected?: boolean; onClick?: () => void; children: ReactNode; icon?: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-body after:absolute after:-inset-y-[2px] after:inset-x-0 ${selected ? "bg-ink text-white font-demibold" : "bg-gray-100 text-ink"}`}
    >
      {icon}
      {children}
    </button>
  );
}
