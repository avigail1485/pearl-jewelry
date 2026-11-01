import { Bell, Trash2 } from "lucide-react"
import { describeFilters, useNav } from "../../nav"
import TopBar from "../ui/TopBar"
import EmptyState from "../ui/EmptyState"
import Button from "../ui/Button"

export default function AlertsScreen() {
  const nav = useNav()
  return (
    <div className="min-h-full bg-white">
      <TopBar title="התראות חכמות" />
      {nav.alerts.length === 0 ? (
        <EmptyState
          art="alerts"
          title="אין התראות פעילות"
          text='מחפשים משהו מסוים? בתוצאות החיפוש לחצו "התראה על חדשים", ונודיע לכם ברגע שיעלה.'
          action={<Button className="mt-2" onClick={() => nav.push({ name: "search" })}>לחיפוש</Button>}
        />
      ) : (
        <ul className="px-5">
          {nav.alerts.map((a, i) => (
            <li key={i} className="flex items-center gap-3 border-b border-line py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender text-blue">
                <Bell size={18} />
              </span>
              <button type="button" onClick={() => nav.push({ name: "results", filters: a })} className="min-w-0 flex-1 text-right">
                <p className="truncate text-[15px] font-semibold">{describeFilters(a)}</p>
                <p className="text-[13px] text-mute">התראה מיידית בכל פריט חדש</p>
              </button>
              <button
                type="button"
                aria-label="מחיקת התראה"
                onClick={() => {
                  nav.removeAlert(i)
                  nav.toast("ההתראה נמחקה")
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-mute hover:bg-lavender hover:text-ink"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
