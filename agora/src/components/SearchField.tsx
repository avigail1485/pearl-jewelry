import { Camera, Search } from "lucide-react";
import { useRef } from "react";

interface Props {
  value?: string;
  onChange?: (v: string) => void;
  onSubmit?: (v: string) => void;
  onFocus?: () => void;
  onImage?: (f: File) => void;
  autoFocus?: boolean;
  readOnlyNav?: boolean;
  className?: string;
}

/** 322×36, radius 8, gray-100 — with camera (search by photo). */
export function SearchField({ value, onChange, onSubmit, onFocus, onImage, autoFocus, className = "" }: Props) {
  const file = useRef<HTMLInputElement>(null);
  return (
    <form
      role="search"
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(value ?? ""); }}
      className={`flex h-9 min-w-0 items-center gap-2 rounded-search bg-gray-100 pr-3 ${className}`}
    >
      <Search size={20} strokeWidth={1.75} className="shrink-0 text-placeholder" aria-hidden />
      <input
        type="search"
        enterKeyHint="search"
        aria-label="חיפוש"
        placeholder="מה מחפשים?"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        autoFocus={autoFocus}
        className="h-full min-w-0 flex-1 bg-transparent text-body [&::-webkit-search-cancel-button]:hidden"
      />
      <button type="button" aria-label="חיפוש לפי תמונה" onClick={() => file.current?.click()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center">
        <Camera size={22} strokeWidth={1.75} />
      </button>
      <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImage?.(f); e.target.value = ""; }} />
    </form>
  );
}
