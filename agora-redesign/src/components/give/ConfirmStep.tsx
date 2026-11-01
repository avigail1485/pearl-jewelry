import Button from "../ui/Button"
import ItemCard from "../home/ItemCard"
import { useNav } from "../../nav"
import type { GiveForm } from "./GiveFlow"
import type { FeedItem } from "../../data/mock"

export default function ConfirmStep({ form, onPublish }: { form: GiveForm; onPublish: () => void }) {
  const nav = useNav()
  const preview: FeedItem = {
    id: "preview", title: form.title, city: form.area, distanceKm: 0, postedLabel: "עכשיו", condition: form.condition,
    photoCount: form.photoCount, status: "available", category: form.category, photo: "",
  }
  return (
    <div className="flex flex-1 flex-col px-5 py-5">
      <h1 className="font-display text-[26px] font-bold text-deep">ככה זה ייראה</h1>
      <p className="mt-1.5 text-[15px] text-ink-soft">בדיוק כפי שהפריט יופיע בפיד.</p>
      <div className="mt-6 flex justify-center">
        <div className="w-[200px]">
          <ItemCard item={preview} interactive={false} />
        </div>
      </div>
      <div className="sticky bottom-0 mt-auto flex flex-col gap-3 bg-ground pt-6 pb-4">
        <p className="text-center text-[13px] text-mute">
          בפרסום אני מאשר/ת את{" "}
          <button type="button" onClick={() => nav.push({ name: "rules" })} className="font-semibold text-brand-strong underline">
            כללי הקהילה של אגורה
          </button>
        </p>
        <Button block onClick={onPublish}>
          לפרסם
        </Button>
        <Button
          block
          variant="secondary"
          onClick={() => {
            nav.toast("נשמר כטיוטה בפריטים שלי")
            nav.reset()
          }}
        >
          לשמור כטיוטה
        </Button>
      </div>
    </div>
  )
}
