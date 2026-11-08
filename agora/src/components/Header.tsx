import { Bell, Camera, Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useImageSearch } from "../lib/useImageSearch";
import { Avatar } from "./Avatar";
import { scroller, scrollTop } from "../lib/scroll";
import { Logo, Pinwheel } from "./Icon";

function BellButton() {
  const nav = useNavigate();
  return (
    <button type="button" aria-label="הודעות" onClick={() => nav("/inbox")} className="tap inline-flex shrink-0 items-center justify-center">
      <Bell size={24} strokeWidth={1.75} />
    </button>
  );
}

/** The search pill (opens the search screen); camera searches by photo. */
function SearchPill({ compact }: { compact: boolean }) {
  const nav = useNavigate();
  const imageSearch = useImageSearch();
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className={`relative flex min-w-0 flex-1 items-center rounded-btn bg-white shadow-card transition-[height] duration-200 ${compact ? "h-11" : "h-12"}`}>
      <button type="button" onClick={() => nav("/search")} className="flex h-full min-w-0 flex-1 items-center justify-center gap-2 rounded-btn pl-11 pr-4">
        <Search size={18} strokeWidth={2.25} aria-hidden className="shrink-0" />
        <span className="truncate text-body font-demibold">מה תרצו לחפש היום?</span>
      </button>
      <button type="button" aria-label="חיפוש לפי תמונה" onClick={() => file.current?.click()} className="absolute left-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-btn">
        <Camera size={20} strokeWidth={1.75} />
      </button>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) imageSearch(f); e.target.value = ""; }} />
    </div>
  );
}

/** Home header. Expanded: logo + avatar, search pill, category tabs. On scroll it collapses to one row. */
export function Header({ tabs }: { tabs?: ReactNode }) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = scroller() ?? window;
    const on = () => setCompact((c) => (c ? scrollTop() > 24 : scrollTop() > 72));
    on();
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`sticky top-0 z-30 pt-safe transition-colors duration-200 ${compact ? "bg-white/85 shadow-[0_1px_0_rgba(30,30,30,.06)] backdrop-blur-md" : "bg-white"}`}>
      <div className={`grid overflow-hidden px-gutter transition-[grid-template-rows,opacity] duration-200 ${compact ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`} aria-hidden={compact}>
        <div className="min-h-0">
          <div className="flex h-[68px] items-center justify-between">
            <Link to="/" aria-label="אגורה · ראשי" tabIndex={compact ? -1 : 0}><Logo size={36} /></Link>
            <Avatar />
          </div>
        </div>
      </div>
      <div className={`flex items-center gap-1 px-gutter ${compact ? "h-16" : "pb-3 pt-1"}`}>
        {compact && <Link to="/" aria-label="אגורה · ראשי" className="tap -mr-1 ml-1 inline-flex shrink-0 items-center justify-center"><Pinwheel size={32} /></Link>}
        <SearchPill compact={compact} />
        <BellButton />
        {compact && <Avatar />}
      </div>
      {tabs && !compact && <div className="border-b border-gray-100">{tabs}</div>}
    </header>
  );
}
