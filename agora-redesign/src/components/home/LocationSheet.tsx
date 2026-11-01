import { useState } from "react"
import { LocateFixed, MapPin } from "lucide-react"
import { cities } from "../../data/mock"
import { useNav } from "../../nav"
import Sheet from "../ui/Sheet"
import Button from "../ui/Button"
import { inputCls } from "../ui/Field"

const radii = [5, 15, 30, 50]

export default function LocationSheet({ onClose }: { onClose: () => void }) {
  const nav = useNav()
  const [city, setCity] = useState(nav.location.city)
  const [radius, setRadius] = useState(nav.location.radius)
  const matches = cities.filter((c) => c.includes(city.trim()) && c !== city)

  const save = () => {
    nav.setLocation({ city: city.trim() || nav.location.city, radius })
    nav.toast(`מציגים פריטים ב${city.trim() || nav.location.city} · עד ${radius} ק"מ`)
    onClose()
  }

  return (
    <Sheet title="איפה לחפש?" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="relative">
          <MapPin size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-mute" />
          <input aria-label="עיר" value={city} onChange={(e) => setCity(e.target.value)} placeholder="הקלידו עיר" className={`${inputCls} pr-11`} />
        </div>
        {city.trim() && matches.length > 0 && (
          <div className="-mt-3 flex flex-col overflow-hidden rounded-[18px] bg-paper" style={{ boxShadow: "var(--shadow-inset)" }}>
            {matches.slice(0, 4).map((c) => (
              <button key={c} type="button" onClick={() => setCity(c)} className="px-4 py-3 text-right text-[15px] text-deep hover:bg-brand-tint">
                {c}
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setCity("רמת גן")} className="flex items-center gap-2 self-start text-[14px] font-semibold text-brand-strong">
          <LocateFixed size={16} />
          להשתמש במיקום הנוכחי
        </button>
        <div>
          <p className="mb-2 text-[15px] font-semibold text-deep">מרחק</p>
          <div className="grid grid-cols-4 gap-2">
            {radii.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                aria-pressed={radius === r}
                className={`h-11 rounded-full text-[14px] font-semibold transition-colors ${radius === r ? "bg-brand text-paper" : "bg-surface text-deep hover:bg-brand-tint"}`}
              >
                {r} ק"מ
              </button>
            ))}
          </div>
        </div>
        <Button block onClick={save}>
          הצגת פריטים
        </Button>
      </div>
    </Sheet>
  )
}
