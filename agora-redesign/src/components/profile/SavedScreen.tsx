import { items } from "../../data/items"
import { useNav } from "../../nav"
import { ItemCard } from "../item/ItemCard"
import EmptyState from "../ui/EmptyState"
import Button from "../ui/Button"

export default function SavedScreen() {
  const nav = useNav()
  const list = nav.saved.map((id) => [...nav.myItems, ...items].find((i) => i.id === id)).filter((i): i is NonNullable<typeof i> => !!i)
  return (
    <div className="bg-white">
      <header className="pt-safe px-5 pb-2">
        <h1 className="text-[26px] font-bold">שמורים</h1>
      </header>
      {list.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 px-4 py-3">
          {list.map((i) => (
            <ItemCard key={i.id} item={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          art="saved"
          title="עוד לא שמרתם חפצים"
          text="לחצו על הלב בכל חפץ כדי לשמור אותו כאן ולחזור אליו אחר כך."
          action={<Button className="mt-2" onClick={() => nav.goTab("home")}>לגלות חפצים</Button>}
        />
      )}
    </div>
  )
}
