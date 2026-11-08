import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "./Avatar";
import { Logo, Pinwheel } from "./Icon";
import { SearchField } from "./SearchField";
import { useImageSearch } from "../lib/useImageSearch";

function BellButton() {
  const nav = useNavigate();
  return (
    <button type="button" aria-label="הודעות" onClick={() => nav("/inbox")} className="tap inline-flex shrink-0 items-center justify-center">
      <Bell size={24} strokeWidth={1.75} />
    </button>
  );
}

/** Home header. Expanded: logo + avatar, search row below. On scroll it collapses to one row. */
export function Header() {
  const [compact, setCompact] = useState(false);
  const nav = useNavigate();
  const imageSearch = useImageSearch();
  useEffect(() => {
    const on = () => setCompact((c) => (c ? window.scrollY > 24 : window.scrollY > 56));
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const goSearch = () => nav("/search");

  return (
    <header className={`sticky top-0 z-30 pt-safe transition-colors duration-200 ${compact ? "bg-white/85 backdrop-blur-md" : "bg-white"}`}>
      {/* Row 1 — logo & avatar (expanded only) */}
      <div
        className={`grid overflow-hidden px-gutter transition-[grid-template-rows,opacity] duration-200 ${compact ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
        aria-hidden={compact}
      >
        <div className="min-h-0">
          <div className="flex h-[72px] items-center justify-between">
            <Link to="/" aria-label="אגורה · ראשי" tabIndex={compact ? -1 : 0}><Logo size={40} /></Link>
            <Avatar />
          </div>
        </div>
      </div>
      {/* Row 2 — search (always) */}
      <div className={`flex items-center gap-1 px-gutter ${compact ? "h-16" : "h-12 pb-2"}`}>
        {compact && <Link to="/" aria-label="אגורה · ראשי" className="tap -mr-1 ml-1 inline-flex shrink-0 items-center justify-center"><Pinwheel size={36} /></Link>}
        <SearchField className="flex-1" onFocus={goSearch} onImage={imageSearch} />
        <BellButton />
        {compact && <Avatar />}
      </div>
    </header>
  );
}
