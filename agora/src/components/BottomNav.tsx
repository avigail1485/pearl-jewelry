import { Heart, House, Plus, Search, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const tabs = [
  { to: "/", label: "ראשי", Icon: House, match: (p: string) => p === "/" },
  { to: "/search", label: "חיפוש", Icon: Search, match: (p: string) => p.startsWith("/search") || p.startsWith("/results") },
  { to: "/give", label: "למסור", Icon: Plus, match: () => false },
  { to: "/saved", label: "אהבתי", Icon: Heart, match: (p: string) => p.startsWith("/saved") },
  { to: "/profile", label: "פרופיל", Icon: User, match: (p: string) => p.startsWith("/profile") },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="ניווט ראשי" className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app bg-white pb-safe shadow-nav">
      <ul className="flex h-nav items-stretch">
        {tabs.map(({ to, label, Icon, match }) => {
          const active = match(pathname);
          const give = to === "/give";
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-nav font-light ${active ? "text-ink" : "text-placeholder"}`}
              >
                {give ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-btn-sm bg-neon text-ink">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                ) : (
                  <Icon size={24} strokeWidth={active ? 2.25 : 1.75} />
                )}
                <span className={give ? "text-ink" : ""}>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
