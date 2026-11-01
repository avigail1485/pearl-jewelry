import { ImageIcon } from "lucide-react"

export default function PhotoPlaceholder({ ratio = "4/3", rounded = "", label }: { ratio?: string; rounded?: string; label?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 bg-fill-2 text-mute ${rounded}`} style={{ aspectRatio: ratio }} aria-hidden="true">
      <ImageIcon size={26} strokeWidth={1.75} />
      {label && <span className="text-[12px] font-medium">{label}</span>}
    </div>
  )
}
