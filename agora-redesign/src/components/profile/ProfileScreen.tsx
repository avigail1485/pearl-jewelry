import { useState } from "react"
import { Bell, BookOpen, CheckCircle2, ChevronLeft, HelpCircle, LogOut, MapPin, Pencil, Plus, RotateCcw, ShieldCheck } from "lucide-react"
import { stats } from "../../data/meta"
import { authErrorCopy, updateProfile, type AuthError } from "../../data/auth"
import { useNav, type Route } from "../../nav"
import { ItemRow } from "../item/ItemCard"
import Button from "../ui/Button"
import Sheet from "../ui/Sheet"
import Field, { inputCls } from "../ui/Field"
import Illustration from "../ui/Illustration"
import TownSheet from "../location/TownSheet"

const memberSince = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(new Date(iso))
  } catch {
    return ""
  }
}

function Community() {
  return (
    <section className="mx-5 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-card ring-1 ring-inset ring-line" aria-label="קהילת אגורה">
      <Illustration name="community" size={110} className="-mt-1" />
      <h2 className="flex items-center gap-2 text-[15px] font-bold">
        <ShieldCheck size={18} className="text-blue" aria-hidden="true" />
        קהילת אגורה
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[22px] font-bold leading-tight tabular-nums">{stats.members}</p>
          <p className="text-[13px] text-ink-2">גולשים נותנים ומקבלים</p>
        </div>
        <div>
          <p className="text-[22px] font-bold leading-tight tabular-nums">{stats.given}</p>
          <p className="text-[13px] text-ink-2">חפצים נמסרו</p>
        </div>
      </div>
      <p className="text-[13px] text-ink-2">הכל בחינם, בלי מספרי 1-900. יוצרים קשר בהודעה בתוך האפליקציה.</p>
    </section>
  )
}

export default function ProfileScreen() {
  const nav = useNav()
  const [tab, setTab] = useState<"active" | "given">("active")
  const [editing, setEditing] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const [townSheet, setTownSheet] = useState(false)
  const [name, setName] = useState(nav.user?.name ?? "")
  const [username, setUsername] = useState(nav.user?.username ?? "")
  const [err, setErr] = useState<AuthError | null>(null)
  const u = nav.user

  const rows: { icon: typeof Bell; label: string; detail?: string; to?: Route; onClick?: () => void }[] = [
    { icon: Bell, label: "התראות חכמות", detail: nav.alerts.length ? `${nav.alerts.length} פעילות` : undefined, to: { name: "alerts" } },
    { icon: MapPin, label: "האזור שלי", detail: nav.location?.town ?? "לא נבחר", onClick: () => setTownSheet(true) },
    { icon: BookOpen, label: "כללי הקהילה", to: { name: "rules" } },
    { icon: HelpCircle, label: "עזרה ויצירת קשר", onClick: () => nav.toast("פנייתכם נשלחה לצוות אגורה") },
  ]

  const menu = (
    <ul className="mx-5">
      {rows.map(({ icon: Icon, label, detail, to, onClick }) => (
        <li key={label}>
          <button type="button" onClick={onClick ?? (() => to && nav.push(to))} className="flex min-h-14 w-full items-center gap-3 border-b border-line text-right">
            <Icon size={20} className="text-ink-2" aria-hidden="true" />
            <span className="flex-1 text-[15px]">{label}</span>
            {detail && <span className="text-[13px] text-ink-2">{detail}</span>}
            <ChevronLeft size={18} className="text-ink-2" aria-hidden="true" />
          </button>
        </li>
      ))}
      {u && (
        <li>
          <button type="button" onClick={() => setConfirmOut(true)} className="flex min-h-14 w-full items-center gap-3 text-right text-[15px] text-ink-2">
            <LogOut size={20} aria-hidden="true" />
            יציאה מהחשבון
          </button>
        </li>
      )}
    </ul>
  )

  const townPicker = townSheet && (
    <TownSheet
      title="האזור שלי"
      current={nav.location?.town}
      onClose={() => setTownSheet(false)}
      onPick={(town, source) => {
        if (source === "manual") nav.setTown(town)
        setTownSheet(false)
        nav.toast(`האזור עודכן ל${town}`)
      }}
    />
  )

  // ── Guest ──────────────────────────────────────────────
  if (!u) {
    return (
      <div className="flex flex-col gap-6 bg-white pb-8">
        <header className="pt-safe px-5">
          <h1 className="text-[26px] font-bold">פרופיל</h1>
        </header>
        <section className="mx-5 flex flex-col items-center gap-3 rounded-3xl bg-lavender p-6 text-center">
          <Illustration name="verified" size={120} />
          <h2 className="text-[19px] font-bold">התחברו כדי למסור ולפנות למוסרים</h2>
          <p className="text-[14px] text-ink-2">אפשר לחפש ולשמור גם בלי חשבון. החשבון נדרש רק כשמוסרים חפץ או לוחצים "אני רוצה את זה".</p>
          <Button block onClick={() => nav.openAuth()}>
            התחברות או הרשמה
          </Button>
        </section>
        {menu}
        <Community />
        {townPicker}
      </div>
    )
  }

  // ── Signed in ──────────────────────────────────────────
  const active = nav.myItems.filter((i) => !i.given)
  const given = nav.myItems.filter((i) => i.given)
  const list = tab === "active" ? active : given

  return (
    <div className="flex flex-col gap-6 bg-white pb-8">
      <header className="pt-safe flex items-center gap-4 px-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue text-[22px] font-bold text-white" aria-hidden="true">
          {u.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w.charAt(0))
            .join("")}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-bold leading-tight">{u.name}</h1>
          <p dir="ltr" className="truncate text-right text-[14px] font-medium text-blue-ink">
            @{u.username}
          </p>
          <p className="text-[13px] text-ink-2">חבר/ה באגורה מ{memberSince(u.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setName(u.name)
            setUsername(u.username)
            setErr(null)
            setEditing(true)
          }}
          aria-label="עריכת פרופיל"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-line hover:bg-lavender"
        >
          <Pencil size={18} />
        </button>
      </header>

      <div className="mx-5 grid grid-cols-3 divide-x divide-x-reverse divide-line rounded-2xl bg-lavender py-4 text-center">
        {[
          [active.length, "בלוח עכשיו"],
          [given.length, "נמסרו"],
          [nav.saved.length, "שמורים"],
        ].map(([n, l]) => (
          <div key={l as string}>
            <p className="text-[20px] font-bold tabular-nums">{n}</p>
            <p className="text-[12px] text-ink-2">{l}</p>
          </div>
        ))}
      </div>

      <section className="px-5">
        <div role="tablist" aria-label="החפצים שלי" className="mb-1 flex gap-5 border-b border-line">
          {(["active", "given"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px min-h-11 border-b-2 text-[15px] font-semibold ${tab === t ? "border-ink text-ink" : "border-transparent text-ink-2"}`}
            >
              {t === "active" ? `בלוח (${active.length})` : `נמסרו (${given.length})`}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-[15px] text-ink-2">{tab === "active" ? "עוד לא פרסמתם חפצים." : "חפצים שתסמנו כנמסרו יופיעו כאן."}</p>
            {tab === "active" && (
              <Button variant="soft" icon={<Plus size={18} />} onClick={() => nav.push({ name: "give" })}>
                למסור חפץ
              </Button>
            )}
          </div>
        ) : (
          <ul>
            {list.map((i) => (
              <li key={i.id} className="border-b border-line last:border-b-0">
                <ItemRow item={i} />
                <div className="-mt-1 flex justify-end pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      nav.setGiven(i.id, !i.given)
                      nav.toast(i.given ? "המודעה חזרה ללוח" : "סומן כנמסר. המודעה ירדה מהלוח")
                    }}
                    className="flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-blue-ink ring-1 ring-inset ring-lavender-2 hover:bg-lavender"
                  >
                    {i.given ? <RotateCcw size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}
                    {i.given ? "להחזיר ללוח" : "סימון כנמסר"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {menu}
      <Community />
      {townPicker}

      {editing && (
        <Sheet
          title="עריכת פרופיל"
          onClose={() => setEditing(false)}
          footer={
            <Button
              block
              onClick={() => {
                const res = updateProfile(u.id, { name, username })
                if (typeof res === "string") return setErr(res)
                nav.setUser(res)
                setEditing(false)
                nav.toast("הפרופיל עודכן")
              }}
            >
              שמירה
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="שם להצגה" htmlFor="p-name" error={err === "bad_name" ? authErrorCopy[err] : undefined}>
              <input id="p-name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} text-[16px]`} />
            </Field>
            <Field label="שם משתמש" htmlFor="p-username" error={err === "bad_username" || err === "username_taken" ? authErrorCopy[err] : undefined} hint="באנגלית: אותיות, ספרות, נקודה או קו תחתון">
              <div dir="ltr" className="flex items-center rounded-2xl bg-lavender ring-blue focus-within:bg-white focus-within:ring-2">
                <span className="ps-4 text-[16px] text-ink-2" aria-hidden="true">@</span>
                <input id="p-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} className="min-w-0 flex-1 bg-transparent px-2 py-3.5 text-[16px] outline-none" />
              </div>
            </Field>
            {u.email && <p className="text-[13px] text-ink-2">אימייל: <span dir="ltr">{u.email}</span></p>}
            {u.provider === "google" && <p className="text-[13px] text-ink-2">מחובר עם Google</p>}
          </div>
        </Sheet>
      )}

      {confirmOut && (
        <Sheet title="לצאת מהחשבון?" onClose={() => setConfirmOut(false)}>
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-ink-2">החפצים שלכם שמורים בחשבון ויחזרו לפרופיל כשתתחברו שוב.</p>
            <Button
              block
              onClick={() => {
                setConfirmOut(false)
                nav.signOut()
              }}
            >
              יציאה
            </Button>
            <Button block variant="outline" onClick={() => setConfirmOut(false)}>
              ביטול
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
