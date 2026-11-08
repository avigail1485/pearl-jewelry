import { Illustration } from "./Illustration";

export function Loading({ label = "טוען…" }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-2 py-16">
      <Illustration name="loading" size={40} eager />
      <span className="sr-only">{label}</span>
    </div>
  );
}
