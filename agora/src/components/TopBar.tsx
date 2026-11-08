import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function BackButton({ onClick, className = "" }: { onClick?: () => void; className?: string }) {
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <button type="button" aria-label="חזרה" onClick={onClick ?? (() => (loc.key !== "default" ? nav(-1) : nav("/")))} className={`tap inline-flex items-center justify-center rounded-btn ${className}`}>
      <ArrowRight size={24} strokeWidth={1.75} />
    </button>
  );
}

export function TopBar({ title, onBack, end, back = true }: { title?: ReactNode; onBack?: () => void; end?: ReactNode; back?: boolean }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 pt-safe backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-3">
        {back ? <BackButton onClick={onBack} /> : <span className="w-3" />}
        <h1 className="flex-1 truncate text-title font-demibold">{title}</h1>
        {end}
      </div>
    </header>
  );
}
