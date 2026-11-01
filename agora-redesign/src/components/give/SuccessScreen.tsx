import { PartyPopper, Share2, PackagePlus, LayoutGrid, Home } from "lucide-react"
import Button from "../ui/Button"
import { useNav } from "../../nav"
import type { GiveForm } from "./GiveFlow"

export default function SuccessScreen({ form, onGiveMore, onHome, onMyItems }: { form: GiveForm; onGiveMore: () => void; onHome: () => void; onMyItems: () => void }) {
  const nav = useNav()
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: form.title, text: `מוסר/ת באגורה: ${form.title}` })
      else {
        await navigator.clipboard?.writeText(`מוסר/ת באגורה: ${form.title}`)
        nav.toast("הקישור הועתק")
      }
    } catch {
      /* user cancelled */
    }
  }
  return (
    <div className="screen-in flex h-full flex-col bg-ground px-5 py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-paper shadow-[0_10px_30px_rgba(0,180,110,0.35)]">
          <PartyPopper size={34} strokeWidth={2} />
        </span>
        <h1 className="mt-5 font-display text-[26px] font-bold text-deep">הפריט שלכם פורסם</h1>
        <p className="mt-2 max-w-[300px] text-[15px] leading-relaxed text-ink-soft">
          שלחנו התראה ל־<b className="text-accent-ink">37</b> אנשים באזור שמחפשים {form.category || "פריטים"}. בדרך כלל הפנייה הראשונה מגיעה תוך כמה שעות.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button block icon={<Share2 size={19} />} onClick={share}>
          שיתוף הפריט
        </Button>
        <Button block variant="secondary" icon={<PackagePlus size={19} />} onClick={onGiveMore}>
          לפרסם עוד חפץ
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="ghost" icon={<LayoutGrid size={18} />} onClick={onMyItems}>
            הפריטים שלי
          </Button>
          <Button variant="ghost" icon={<Home size={18} />} onClick={onHome}>
            לדף הבית
          </Button>
        </div>
      </div>
    </div>
  )
}
