import { MapPin } from "lucide-react";
import { useId, useState } from "react";
import { suggestCities } from "../lib/cities";

/**
 * Type a few letters, pick the place. "י" → ירושלים, יקנעם עילית, יבנה…
 * Accessible combobox: arrows move, Enter picks, Escape closes.
 */
export function CityInput({ value, onPick, label = "יישוב", autoFocus }: { value: string; onPick: (c: string) => void; label?: string; autoFocus?: boolean }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const list = suggestCities(q);
  const pick = (c: string) => { onPick(c); setQ(""); setOpen(false); };

  return (
    <div>
      <label htmlFor={id} className="text-meta text-ink/65">{label}</label>
      <div className="field mt-1 flex h-12 items-center gap-2 rounded-btn bg-gray-100 px-3">
        <MapPin size={18} strokeWidth={1.75} aria-hidden className="shrink-0" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open && list.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && list[active] ? `${id}-o${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          value={open ? q : q || value}
          placeholder="הקלידו שם יישוב"
          onFocus={() => { setOpen(true); setQ(""); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, list.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === "Enter" && list[active]) { e.preventDefault(); pick(list[active]); }
            else if (e.key === "Escape") setOpen(false);
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-body"
        />
      </div>
      {open && q && (
        <ul id={`${id}-list`} role="listbox" className="mt-2 max-h-72 overflow-y-auto rounded-tile bg-white py-1 shadow-card">
          {list.length ? list.map((c, i) => (
            <li
              key={c}
              id={`${id}-o${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(c); }}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-[44px] cursor-pointer items-center gap-2 px-4 text-body ${i === active ? "bg-gray-100" : ""}`}
            >
              <MapPin size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-ink/65" />{c}
            </li>
          )) : <li className="px-4 py-3 text-body text-ink/65">לא מצאנו יישוב בשם הזה</li>}
        </ul>
      )}
    </div>
  );
}
