import { useState } from "react"
import { Check } from "lucide-react"
import { cities, conditions } from "../../data/meta"
import { filterItems } from "../../data/filter"
import { emptyFilters, type Filters } from "../../nav"
import Sheet from "../ui/Sheet"
import Button from "../ui/Button"
import Chip from "../ui/Chip"

export default function FilterSheet({ value, onApply, onClose }: { value: Filters; onApply: (f: Filters) => void; onClose: () => void }) {
  const [f, setF] = useState(value)
  const count = filterItems(f).length
  const toggleCond = (c: (typeof conditions)[number]) =>
    setF((p) => ({ ...p, conditions: p.conditions.includes(c) ? p.conditions.filter((x) => x !== c) : [...p.conditions, c] }))

  return (
    <Sheet
      title="סינון"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setF({ ...emptyFilters, query: f.query, category: f.category, sub: f.sub })} className="px-2 text-[15px] font-semibold underline underline-offset-4">
            ניקוי
          </button>
          <Button className="flex-1" onClick={() => onApply(f)} disabled={count === 0}>
            {count === 0 ? "אין תוצאות" : `הצגת ${count} פריטים`}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-7">
        <section>
          <h3 className="mb-3 text-[16px] font-bold">אזור</h3>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <Chip key={c} selected={f.city === c} onClick={() => setF((p) => ({ ...p, city: c }))}>
                {c}
              </Chip>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-1 text-[16px] font-bold">מצב החפץ</h3>
          {conditions.map((c) => {
            const on = f.conditions.includes(c)
            return (
              <button key={c} type="button" role="checkbox" aria-checked={on} onClick={() => toggleCond(c)} className="flex w-full items-center justify-between border-b border-line py-3.5 text-right text-[15px] last:border-b-0">
                {c}
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ${on ? "bg-blue text-white" : "ring-1 ring-inset ring-line"}`}>{on && <Check size={16} strokeWidth={3} />}</span>
              </button>
            )
          })}
        </section>
        <section>
          <h3 className="mb-3 text-[16px] font-bold">מיון</h3>
          <div className="flex gap-2">
            <Chip selected={f.sort === "new"} onClick={() => setF((p) => ({ ...p, sort: "new" }))}>
              החדשים ביותר
            </Chip>
            <Chip selected={f.sort === "condition"} onClick={() => setF((p) => ({ ...p, sort: "condition" }))}>
              המצב הטוב ביותר
            </Chip>
          </div>
        </section>
      </div>
    </Sheet>
  )
}
