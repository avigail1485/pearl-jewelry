export type IllustrationName = "alerts" | "community" | "message-sent" | "no-results" | "photo" | "published" | "saved" | "verified"

/**
 * Spot illustrations (Magnific, Agora palette). Used only on empty, confirmation and success
 * moments — never on browsing screens, where item photos lead. Decorative: alt is empty.
 */
export default function Illustration({ name, size = 180, className = "" }: { name: IllustrationName; size?: number; className?: string }) {
  return (
    <img
      src={`illustrations/${name}.webp`}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ maxHeight: size }}
      className={`mx-auto h-auto w-auto max-w-full select-none mix-blend-multiply ${className}`}
    />
  )
}
