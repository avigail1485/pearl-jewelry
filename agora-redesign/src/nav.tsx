import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { Condition, Item } from "./data/types"
import { getDevicePosition, nearestTown, townPoint, type GeoPoint, type LocateError } from "./data/location"
import { sessionUser, signOut as authSignOut, type User } from "./data/auth"

/** Where to search: anywhere, around the viewer, or one town. */
export type Place = { kind: "all" } | { kind: "near"; km: number } | { kind: "town"; town: string }

export type Filters = {
  query: string
  category?: string
  sub?: string
  place: Place
  conditions: Condition[]
  sort: "new" | "near" | "condition"
  /** Set when the search came from a photo: what was recognised */
  photo?: { label: string }
  /** Photo search: rank by these words, within the detected category */
  keywords?: string[]
}

export const emptyFilters: Filters = { query: "", place: { kind: "all" }, conditions: [], sort: "new" }

export type SearchSection = "what" | "where" | "condition" | "sort"

export type Route =
  | { name: "home" }
  | { name: "search"; filters?: Filters; open?: SearchSection; from?: "results" }
  | { name: "results"; filters: Filters }
  | { name: "item"; item: Item }
  | { name: "give" }
  | { name: "saved" }
  | { name: "profile" }
  | { name: "alerts" }
  | { name: "rules" }

export type Tab = "home" | "search" | "saved" | "profile"

/** The viewer's area: from the device (gps) or picked by hand (manual). */
export type MyLocation = { town: string; point: GeoPoint; source: "gps" | "manual" }
export type LocateResult = { ok: true; town: string } | { ok: false; error: LocateError }

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
  location: MyLocation | null
  locating: boolean
  /** Ask the device for its position. Never rejects. */
  locate: () => Promise<LocateResult>
  setTown: (town: string) => void
  clearLocation: () => void
  /** An unfinished give-flow form, kept when the giver leaves mid-way */
  draft: unknown
  setDraft: (d: unknown) => void
  /** Signed-in user, or null for a guest. Browsing never needs an account. */
  user: User | null
  setUser: (u: User | null) => void
  signOut: () => void
  /** Run `then` now if signed in; otherwise ask to sign in first and run it right after. */
  requireAuth: (reason: string, then: () => void) => void
  authRequest: { reason: string; then?: () => void } | null
  openAuth: (reason?: string) => void
  closeAuth: (signedIn: boolean) => void
  /** Items the signed-in user published (kept in this browser) */
  myItems: Item[]
  publishItem: (item: Item) => void
  setGiven: (id: string, given: boolean) => void
}

const NavCtx = createContext<Nav | null>(null)

export function useNav() {
  const ctx = useContext(NavCtx)
  if (!ctx) throw new Error("useNav outside provider")
  return ctx
}

const LOC_KEY = "agora.location"
function readStoredLocation(): MyLocation | null {
  try {
    const raw = localStorage.getItem(LOC_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as MyLocation
    return townPoint(v.town) ? v : null
  } catch {
    return null
  }
}
function storeLocation(v: MyLocation | null) {
  try {
    if (v) localStorage.setItem(LOC_KEY, JSON.stringify(v))
    else localStorage.removeItem(LOC_KEY)
  } catch {
    /* storage blocked: location simply isn't remembered */
  }
}

const itemsKey = (uid?: string) => `agora.items.${uid}`
function readItems(uid?: string): Item[] {
  if (!uid) return []
  try {
    return JSON.parse(localStorage.getItem(itemsKey(uid)) ?? "[]") as Item[]
  } catch {
    return []
  }
}
function writeItems(uid: string | undefined, list: Item[]) {
  if (!uid) return
  try {
    localStorage.setItem(itemsKey(uid), JSON.stringify(list))
  } catch {
    /* storage full or blocked: items stay for this session only */
  }
}

/** In-app history stack, mirrored to browser history so the device back button works too. */
export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: "home" }])
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [saved, setSaved] = useState<string[]>([])
  const [alerts, setAlerts] = useState<Filters[]>([])
  const [recent, setRecent] = useState<string[]>(["שידה", "מיטת תינוק"])
  const [verified, setVerified] = useState(false)
  const [location, setLocation] = useState<MyLocation | null>(readStoredLocation)
  const [locating, setLocating] = useState(false)
  const [draft, setDraft] = useState<unknown>(null)
  const [user, setUserState] = useState<User | null>(sessionUser)
  const [authRequest, setAuthRequest] = useState<{ reason: string; then?: () => void } | null>(null)
  const [myItems, setMyItems] = useState<Item[]>(() => readItems(sessionUser()?.id))
  // Continuations queued behind sign-in run after the user changes; they read the user from here, never from a stale closure
  const userRef = useRef<User | null>(user)
  const timer = useRef<number | undefined>(undefined)

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToastMsg(null), 2600)
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
      toast(has ? "הוסר מהשמורים" : "נשמר בשמורים")
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

  const setLoc = useCallback((v: MyLocation | null) => {
    setLocation(v)
    storeLocation(v)
  }, [])

  const locate = useCallback(async (): Promise<LocateResult> => {
    setLocating(true)
    const res = await getDevicePosition()
    setLocating(false)
    if (!res.ok) return { ok: false, error: res.error }
    const { town } = nearestTown(res.point)
    setLoc({ town, point: res.point, source: "gps" })
    return { ok: true, town }
  }, [setLoc])

  const setTown = useCallback((town: string) => {
    const p = townPoint(town)
    if (p) setLoc({ town, point: p, source: "manual" })
  }, [setLoc])

  const clearLocation = useCallback(() => setLoc(null), [setLoc])

  const setUser = useCallback((u: User | null) => {
    userRef.current = u
    setUserState(u)
    setMyItems(readItems(u?.id))
  }, [])
  const signOut = useCallback(() => {
    authSignOut()
    setUser(null)
    setVerified(false)
    toast("התנתקתם מהחשבון")
  }, [setUser, toast])

  const requireAuth = useCallback(
    (reason: string, then: () => void) => {
      if (userRef.current) then()
      else setAuthRequest({ reason, then })
    },
    [],
  )
  const openAuth = useCallback((reason = "התחברו כדי לנהל את הפרופיל והחפצים שלכם") => setAuthRequest({ reason }), [])
  const closeAuth = useCallback(
    (signedIn: boolean) => {
      const req = authRequest
      setAuthRequest(null)
      // Continue exactly where the person was, once the new user state has rendered
      if (signedIn && req?.then) window.setTimeout(req.then, 0)
    },
    [authRequest],
  )

  const publishItem = useCallback(
    (item: Item) => {
      const u = userRef.current
      const owned: Item = { ...item, ownerId: u?.id, giver: u?.name ?? item.giver }
      setMyItems((list) => {
        const next = [owned, ...list]
        writeItems(u?.id, next)
        return next
      })
    },
    [],
  )
  const setGiven = useCallback(
    (id: string, given: boolean) => {
      setMyItems((list) => {
        const next = list.map((i) => (i.id === id ? { ...i, given } : i))
        writeItems(userRef.current?.id, next)
        return next
      })
    },
    [],
  )

  return (
    <NavCtx.Provider
      value={{
        route: stack[stack.length - 1], push, replace, back, goTab, toast, saved, toggleSaved, alerts, addAlert, removeAlert, recent, addRecent,
        verified, setVerified, location, locating, locate, setTown, clearLocation, draft, setDraft,
        user, setUser, signOut, requireAuth, authRequest, openAuth, closeAuth, myItems, publishItem, setGiven,
      }}
    >
      {children}
      {toastMsg && (
        <div role="status" className="toast-in pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+14px)] z-50 w-max max-w-[340px] -translate-x-1/2 rounded-2xl bg-ink px-4 py-3 text-center text-[14px] font-medium text-white shadow-lg">
          {toastMsg}
        </div>
      )}
    </NavCtx.Provider>
  )
}

export function placeLabel(p: Place, location: MyLocation | null) {
  if (p.kind === "all") return "כל הארץ"
  if (p.kind === "town") return p.town
  return location ? `עד ${p.km} ק"מ מ${location.town}` : `עד ${p.km} ק"מ ממך`
}

export function describeFilters(f: Filters, location: MyLocation | null = null) {
  const what = f.photo ? `דומים ל${f.photo.label}` : f.query || f.sub || f.category || "כל החפצים"
  const parts = [what]
  if (f.place.kind !== "all") parts.push(placeLabel(f.place, location))
  if (f.conditions.length) parts.push(f.conditions.join(" או "))
  return parts.join(", ")
}
