import { LayoutGrid } from "lucide-react";
import { CATEGORIES, CATEGORY_ICONS } from "../lib/categories";

/** Airbnb-style icon tabs across the top of the board. */
export function CategoryTabs({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const all = [{ key: "", label: "הכל", Icon: LayoutGrid }, ...CATEGORIES.map((c) => ({ key: c, label: c, Icon: CATEGORY_ICONS[c] }))];
  return (
    <div role="tablist" aria-label="קטגוריות" className="no-scrollbar flex gap-6 overflow-x-auto px-gutter">
      {all.map(({ key, label, Icon }) => {
        const on = value === key;
        return (
          <button
            key={label}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(key)}
            className={`relative flex min-h-[64px] min-w-[44px] shrink-0 flex-col items-center justify-center gap-1 pb-2 pt-1 ${on ? "text-ink" : "text-ink/65"}`}
          >
            <Icon size={24} strokeWidth={on ? 2.25 : 1.75} aria-hidden />
            <span className={`whitespace-nowrap text-nav ${on ? "font-demibold" : ""}`}>{label}</span>
            <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${on ? "bg-ink" : "bg-transparent"}`} />
          </button>
        );
      })}
    </div>
  );
}
