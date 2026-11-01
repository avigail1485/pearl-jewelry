import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { FeedItem, OpenRequest } from "./data/mock"

export type Route =
  | { name: "home" }
  | { name: "search"; query?: string }
  | { name: "category"; label: string }
  | { name: "all" }
  | { name: "item"; item: FeedItem }
  | { name: "give"; forRequest?: OpenRequest }
  | { name: "request" }
  | { name: "myitems" }
  | { name: "saved" }
  | { name: "profile" }
  | { name: "palette" }
  | { name: "rules" }

export type Location = { city: string; radius: number }

type Nav = {
  route: Route
  canGoBack: boolean
  push: (r: Route) => void
  back: () => void
  reset: (r?: Route) => void
  toast: (msg: string) => void
  saved: Set<string>
  toggleSaved: (id: string) => void
  location: Location
  setLocation: (l: Location) => void
}

const NavCtx = createContext<Nav | null>(null)

export function useNav() {
  const ctx = useContext(NavCtx)
  if (!ctx) throw new Error("useNav outside provider")
  return ctx
}

/** In-app history stack, mirrored to the browser history so the phone/browser back button works too. */
export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: "home" }])
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [location, setLocation] = useState<Location>({ city: "תל אביב-יפו", radius: 15 })
  const toastTimer = useRef<number | undefined>(undefined)

  const push = useCallback((r: Route) => {
    setStack((s) => [...s, r])
    try {
      window.history.pushState({ agora: true }, "")
    } catch {
      /* sandboxed preview */
    }
  }, [])

  const back = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }, [])

  const reset = useCallback((r: Route = { name: "home" }) => setStack([r]), [])

  useEffect(() => {
    const onPop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2400)
  }, [])

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const route = stack[stack.length - 1]

  return (
    <NavCtx.Provider
      value={{ route, canGoBack: stack.length > 1, push, back, reset, toast, saved, toggleSaved, location, setLocation }}
    >
      {children}
      {toastMsg && (
        <div
          role="status"
          className="toast-in pointer-events-none fixed bottom-28 left-1/2 z-50 max-w-[360px] -translate-x-1/2 rounded-full bg-deep px-5 py-3 text-center text-[14px] font-medium text-paper"
          style={{ boxShadow: "var(--shadow-float)" }}
        >
          {toastMsg}
        </div>
      )}
    </NavCtx.Provider>
  )
}
