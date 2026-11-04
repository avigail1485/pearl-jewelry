import type { ReactNode } from "react"
import { NavProvider, useNav, type Route, type Tab } from "./nav"
import Home from "./components/home/Home"
import BottomNav from "./components/home/BottomNav"
import SearchScreen from "./components/search/SearchScreen"
import ResultsScreen from "./components/search/ResultsScreen"
import ItemPage from "./components/item/ItemPage"
import GiveFlow from "./components/give/GiveFlow"
import AuthSheet from "./components/auth/AuthSheet"
import SavedScreen from "./components/profile/SavedScreen"
import ProfileScreen from "./components/profile/ProfileScreen"
import AlertsScreen from "./components/profile/AlertsScreen"
import RulesScreen from "./components/profile/RulesScreen"

const key = (r: Route) => (r.name === "item" ? `item-${r.item.id}` : r.name === "results" ? `res-${JSON.stringify(r.filters)}` : r.name)

function Screen() {
  const { route } = useNav()

  // Task flows take the full screen (own back/close, no tab bar)
  if (route.name === "item") return <ItemPage key={key(route)} item={route.item} />
  if (route.name === "give") return <GiveFlow />
  if (route.name === "search") return <SearchScreen key={JSON.stringify(route.filters ?? null) + (route.open ?? "")} filters={route.filters} open={route.open} from={route.from} />

  let body: ReactNode
  let tab: Tab | undefined
  switch (route.name) {
    case "results": body = <ResultsScreen filters={route.filters} />; tab = "search"; break
    case "saved": body = <SavedScreen />; tab = "saved"; break
    case "profile": body = <ProfileScreen />; tab = "profile"; break
    case "alerts": body = <AlertsScreen />; tab = "profile"; break
    case "rules": body = <RulesScreen />; tab = "profile"; break
    default: body = <Home />; tab = "home"
  }
  return (
    <>
      <main key={route.name === "results" ? "results" : key(route)} className="screen-in no-scrollbar flex-1 overflow-y-auto bg-white pb-20">
        {body}
      </main>
      <BottomNav active={tab} />
    </>
  )
}

export default function App() {
  return (
    <NavProvider>
      <div className="flex h-full w-full justify-center bg-canvas">
        <div className="relative flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-[0_0_48px_rgba(22,24,29,.08)]">
          <Screen />
          <AuthSheet />
        </div>
      </div>
    </NavProvider>
  )
}
