import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { HashRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { isHosted } from "./api/platform";
import { BottomNav } from "./components/BottomNav";
import { Loading } from "./components/Loading";
import { LoginSheet } from "./components/LoginSheet";
import { LocationPrompt } from "./components/LocationPrompt";
import { Toast } from "./components/Toast";
import { BusyOverlay } from "./components/BusyOverlay";
import Home from "./screens/Home";
import Item from "./screens/Item";
import { useItems } from "./store/items";
import { scrollToTop } from "./lib/scroll";
import { useUser } from "./store/user";

const Welcome = lazy(() => import("./screens/Welcome"));
const Search = lazy(() => import("./screens/Search"));
const Results = lazy(() => import("./screens/Results"));
const Give = lazy(() => import("./screens/give/Give"));
const Published = lazy(() => import("./screens/give/Published"));
const Saved = lazy(() => import("./screens/Saved"));
const Profile = lazy(() => import("./screens/Profile"));
const Inbox = lazy(() => import("./screens/Inbox"));
const Chat = lazy(() => import("./screens/Chat"));
const MessageSent = lazy(() => import("./screens/MessageSent"));
const Help = lazy(() => import("./screens/Help"));

function WithNav({ children }: { children: ReactNode }) {
  return <><div className="pb-[calc(75px+env(safe-area-inset-bottom))]">{children}</div><BottomNav /></>;
}

function FirstRun({ children }: { children: ReactNode }) {
  const welcomed = useUser((s) => s.welcomed);
  const { pathname } = useLocation();
  if (!welcomed && pathname === "/") return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { scrollToTop(); }, [pathname]);
  return null;
}

// Inside the private host frame the URL hash is not ours to use, so routing stays in memory there.
const Router = isHosted() ? MemoryRouter : HashRouter;

export default function App() {
  useEffect(() => { void useUser.getState().init(); useItems.getState().init(); }, []);
  return (
    <Router>
      <ScrollTop />
      <div id="app-frame" className="app-frame">
      <div id="scroll-root" className="h-full overflow-y-auto overscroll-contain bg-white">
        <Suspense fallback={<Loading />}>
          <FirstRun>
            <Routes>
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/" element={<WithNav><Home /></WithNav>} />
              <Route path="/search" element={<Search />} />
              <Route path="/results" element={<WithNav><Results /></WithNav>} />
              <Route path="/item/:id" element={<Item />} />
              <Route path="/sent/:tid" element={<MessageSent />} />
              <Route path="/give" element={<Give />} />
              <Route path="/give/published/:id" element={<Published />} />
              <Route path="/saved" element={<WithNav><Saved /></WithNav>} />
              <Route path="/profile" element={<WithNav><Profile /></WithNav>} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/chat/:tid" element={<Chat />} />
              <Route path="/help" element={<Help />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </FirstRun>
        </Suspense>
      </div>
      <LoginSheet />
      <LocationPrompt />
      <Toast />
      <BusyOverlay />
      </div>
    </Router>
  );
}
