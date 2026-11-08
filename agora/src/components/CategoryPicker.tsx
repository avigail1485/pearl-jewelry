import { CATEGORIES, CATEGORY_ICONS } from "../lib/categories";

/** Icon tiles with the category name small underneath. */
export function CategoryPicker({ selected, onToggle }: { selected: string[]; onToggle: (c: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-4">
      {CATEGORIES.map((c) => {
        const Icon = CATEGORY_ICONS[c];
        const on = selected.includes(c);
        return (
          <button key={c} type="button" aria-pressed={on} onClick={() => onToggle(c)} className="flex flex-col items-center gap-1.5 rounded-btn text-center">
            <span className={`flex h-14 w-14 items-center justify-center rounded-btn ${on ? "bg-ink text-white" : "bg-gray-100"}`}>
              <Icon size={24} strokeWidth={on ? 2.25 : 1.75} />
            </span>
            <span className={`text-nav leading-tight ${on ? "font-demibold" : ""}`}>{c}</span>
          </button>
        );
      })}
    </div>
  );
}
