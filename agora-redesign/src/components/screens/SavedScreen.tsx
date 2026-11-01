import { Heart } from "lucide-react"
import { previewFeed } from "../../data/mock"
import { useNav } from "../../nav"
import ScreenHeader from "../ui/ScreenHeader"
import Button from "../ui/Button"
import ItemGrid from "../home/ItemGrid"

export default function SavedScreen() {
  const nav = useNav()
  const items = previewFeed.filter((i) => nav.saved.has(i.id))
  return (
    <div className="flex flex-col">
      <ScreenHeader title="שמורים" />
      <div className="px-5 pt-1 pb-6">
        {items.length ? (
          <ItemGrid items={items} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[24px] bg-paper px-6 py-10 text-center" style={{ boxShadow: "var(--shadow-raised)" }}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-tint text-accent-ink">
              <Heart size={24} />
            </span>
            <h3 className="text-[17px] font-bold text-deep">אין עדיין פריטים שמורים</h3>
            <p className="text-[14px] text-mute">לחצו על הלב בכרטיס פריט כדי לשמור אותו כאן.</p>
            <Button onClick={() => nav.reset()}>לדף הבית</Button>
          </div>
        )}
      </div>
    </div>
  )
}
