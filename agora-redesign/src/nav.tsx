import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { Condition, Item, WantedRequest } from "./data/types"

export type Filters = {
  query: string
  category?: string
  sub?: string
  city: string
  conditions: Condition[]
  sort: "new" | "condition"
  /** Set when the search came from a photo: what the AI saw, and the photo itself */
  photo?: { url: string; label: string; demo?: boolean }
  /** Photo search: rank by these words, within the detected category */
  keywords?: string[]
}

export const emptyFilters: Filters = { query: "", city: "כל הארץ", conditions: [], sort: "new" }

export type Route =
  | { name: "home" }
  | { name: "search"; initial?: string }
  | { name: "results"; filters: Filters }
  | { name: "item"; item: Item }
  | { name: "give"; forRequest?: WantedRequest }
  | { name: "request" }
  | { name: "saved" }
  | { name: "profile" }
  | { name: "alerts" }
  | { name: "rules" }

export type Tab = "home" | "search" | "saved" | "profile"

type Nav = {
  route: Route
  push: (r: Route) => void
  replace: (r: Route) => void
  back: () => void
  goTab: (t: Tab) => void
  toast: (msg: string) => void
  saved: string[]
  toggleSaved: (item: Item) => void
  alerts: Filters[]
  addAlert: (f: Filters) => void
  removeAlert: (i: number) => void
  recent: string[]
  addRecent: (q: string) => void
  /** Phone verified once per session; contacting more givers skips the SMS step */
  verified: boolean
  setVerified: (v: boolean) => void
}

const NavCtx = createContext<Nav | null>(null)

export function useNav() {
  const ctx = useContext(NavCtx)
  if (!ctx) throw new Error("useNav outside provider")
  return ctx
}

/** In-app history stack, mirrored to browser history so the device back button works too. */
export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: "home" }])
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [saved, setSaved] = useState<string[]>([])
  const [alerts, setAlerts] = useState<Filters[]>([])
  const [recent, setRecent] = useState<string[]>(["שידה", "מיטת תינוק"])
  const [verified, setVerified] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToastMsg(null), 2400)
  }, [])

  const push = useCallback((r: Route) => {
    setStack((s) => [...s, r])
    try {
      window.history.pushState({ agora: true }, "")
    } catch {
      /* sandboxed */
    }
  }, [])
  const replace = useCallback((r: Route) => setStack((s) => [...s.slice(0, -1), r]), [])
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), [])
  const goTab = useCallback((t: Tab) => setStack(t === "home" ? [{ name: "home" }] : [{ name: "home" }, { name: t } as Route]), [])

  useEffect(() => {
    const onPop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const toggleSaved = useCallback(
    (item: Item) => {
      const has = saved.includes(item.id)
      toast(has ? "הוסר מהשמורים" : "נשמר · אפשר למצוא בלשונית שמורים")
      setSaved(has ? saved.filter((x) => x !== item.id) : [item.id, ...saved])
    },
    [saved, toast],
  )

  const addAlert = useCallback(
    (f: Filters) => {
      setAlerts((a) => [f, ...a])
      toast("נודיע לכם כשיעלה פריט מתאים")
    },
    [toast],
  )
  const removeAlert = useCallback((i: number) => setAlerts((a) => a.filter((_, k) => k !== i)), [])
  const addRecent = useCallback((q: string) => q.trim() && setRecent((r) => [q.trim(), ...r.filter((x) => x !== q.trim())].slice(0, 5)), [])

  return (
    <NavCtx.Provider
      value={{ route: stack[stack.length - 1], push, replace, back, goTab, toast, saved, toggleSaved, alerts, addAlert, removeAlert, recent, addRecent, verified, setVerified }}
    >
      {children}
      {toastMsg && (
        <div role="status" className="toast-in pointer-events-none fixed bottom-32 left-1/2 z-50 w-max max-w-[340px] -translate-x-1/2 rounded-2xl bg-ink px-4 py-3 text-center text-[14px] font-medium text-white shadow-lg">
          {toastMsg}
        </div>
      )}
    </NavCtx.Provider>
  )
}

export function describeFilters(f: Filters) {
  const parts = [f.photo ? `דומים ל${f.photo.label}` : f.query || f.sub || f.category || "כל הפריטים"]
  if (f.city !== "כל הארץ") parts.push(f.city)
  if (f.conditions.length) parts.push(f.conditions.join(", "))
  return parts.join(" · ")
}
