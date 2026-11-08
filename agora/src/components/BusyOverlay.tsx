import { useUI } from "../store/ui";
import { Illustration } from "./Illustration";

/** Full-screen "working on it" moment, e.g. while a photo is being searched. */
export function BusyOverlay() {
  const busy = useUI((s) => s.busy);
  if (!busy) return null;
  return (
    <div role="status" aria-live="polite" className="scrim-enter absolute inset-0 z-[70] flex flex-col items-center justify-center bg-white px-gutter text-center">
      <Illustration name="searching" size={180} eager />
      <p className="mt-4 text-title font-demibold">{busy.title}</p>
      <p className="mt-1 text-body text-ink/65">{busy.text}</p>
    </div>
  );
}
