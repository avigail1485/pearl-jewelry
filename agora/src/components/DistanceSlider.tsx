const MAX = 100;

/** Distance in km; the far end of the track means "anywhere". */
export function DistanceSlider({ value, onChange, city }: { value: number | null; onChange: (km: number | null) => void; city: string }) {
  const v = value ?? MAX;
  const pct = ((v - 1) / (MAX - 1)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor="km" className="text-body">כמה רחוק מ{city}?</label>
        <output htmlFor="km" className="text-body font-demibold">{value ? `עד ${value} ק"מ` : "כל הארץ"}</output>
      </div>
      <input
        id="km"
        type="range"
        min={1}
        max={MAX}
        step={1}
        value={v}
        onChange={(e) => { const n = Number(e.target.value); onChange(n >= MAX ? null : n); }}
        className="agora-range mt-4 w-full"
        style={{ background: `linear-gradient(to left, #1E1E1E ${pct}%, #F6F6F6 ${pct}%)` }}
        aria-valuetext={value ? `עד ${value} קילומטר` : "כל הארץ"}
      />
      <div className="mt-1 flex justify-between text-meta text-ink/65" aria-hidden><span>1 ק"מ</span><span>כל הארץ</span></div>
    </div>
  );
}
