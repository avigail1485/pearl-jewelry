import { Heart } from "lucide-react";
import { useRef } from "react";
import { heartPop } from "../lib/motion";
import { useSaved } from "../store/saved";
import { useUI } from "../store/ui";
import { HeartFilled } from "./Icon";

export function SaveButton({ id, title, floating = true, size = 20 }: { id: string; title: string; floating?: boolean; size?: number }) {
  const saved = useSaved((s) => s.ids.includes(id));
  const toggle = useSaved((s) => s.toggle);
  const toast = useUI((s) => s.showToast);
  const icon = useRef<HTMLSpanElement>(null);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `הסרה מאהבתי: ${title}` : `שמירה באהבתי: ${title}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); if (!saved) heartPop(icon.current); toast(saved ? "הוסר מאהבתי" : "נשמר באהבתי"); }}
      className="tap inline-flex items-center justify-center rounded-btn-sm"
    >
      <span ref={icon} className={`inline-flex items-center justify-center rounded-btn-sm ${floating ? "h-9 w-9 bg-white shadow-card" : ""}`}>
        {saved ? <HeartFilled size={size} /> : <Heart size={size} strokeWidth={1.75} />}
      </span>
    </button>
  );
}
