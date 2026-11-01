import { NavProvider, useNav, type Route } from "./nav"
import { previewFeed } from "./data/mock"
import Home from "./components/home/Home"
import BottomNav from "./components/home/BottomNav"
import GiveFlow from "./components/give/GiveFlow"
import ItemPage from "./components/want/ItemPage"
import RequestFlow from "./components/want/RequestFlow"
import SearchScreen from "./components/screens/SearchScreen"
import ListScreen from "./components/screens/ListScreen"
import MyItemsScreen from "./components/screens/MyItemsScreen"
import SavedScreen from "./components/screens/SavedScreen"
import ProfileScreen from "./components/screens/ProfileScreen"
import PaletteScreen from "./components/screens/PaletteScreen"
import RulesScreen from "./components/screens/RulesScreen"

function routeKey(r: Route) {
  if (r.name === "item") return `item-${r.item.id}`
  if (r.name === "category") return `cat-${r.label}`
  return r.name
}

function Screen() {
  const { route } = useNav()

  // Full-screen flows (own header + back, no tab bar)
  if (route.name === "give") return <GiveFlow key={routeKey(route)} forRequest={route.forRequest} />
  if (route.name === "request") return <RequestFlow />
  if (route.name === "item") return <ItemPage key={routeKey(route)} item={route.item} />

  let body: React.ReactNode
  let tab: "home" | "search" | "myitems" | "profile" = "home"
  switch (route.name) {
    case "search":
      body = <SearchScreen initial={route.query} />
      tab = "search"
      break
    case "category":
      body = <ListScreen title={route.label} items={previewFeed.filter((i) => i.category === route.label)} />
      break
    case "all":
      body = <ListScreen title="כל הפריטים באזור" items={previewFeed} />
      break
    case "myitems":
      body = <MyItemsScreen />
      tab = "myitems"
      break
    case "saved":
      body = <SavedScreen />
      tab = "profile"
      break
    case "profile":
      body = <ProfileScreen />
      tab = "profile"
      break
    case "palette":
      body = <PaletteScreen />
      tab = "profile"
      break
    case "rules":
      body = <RulesScreen />
      tab = "profile"
      break
    default:
      body = <Home />
  }

  return (
    <>
      <main key={routeKey(route)} className="screen-in no-scrollbar flex-1 overflow-y-auto pb-28">
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
        {/* Mobile shell — desktop is an extension of mobile */}
        <div className="relative flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-ground shadow-[0_0_40px_rgba(0,0,0,0.08)]">
          <Screen />
        </div>
      </div>
    </NavProvider>
  )
}
