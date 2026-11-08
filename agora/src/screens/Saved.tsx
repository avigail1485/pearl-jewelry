import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ItemGrid } from "../components/ItemTile";
import { useItems } from "../store/items";
import { useSaved } from "../store/saved";

export default function Saved() {
  const ids = useSaved((s) => s.ids);
  const byId = useItems((s) => s.byId);
  useItems((s) => s.live);
  const items = ids.map(byId).filter(Boolean) as NonNullable<ReturnType<typeof byId>>[];
  const nav = useNavigate();
  return (
    <div className="min-h-[100dvh] pb-8 pt-safe">
      <header className="px-gutter pb-3 pt-5"><h1 className="text-section font-light">אהבתי</h1></header>
      <main className="px-gutter">
        {items.length === 0 ? (
          <EmptyState name="saved-empty" size={170} title="עוד לא שמרתם חפצים" text="לחצו על הלב בחפץ שאהבתם, והוא יחכה לכם כאן.">
            <Button block onClick={() => nav("/")}>לגלות חפצים</Button>
          </EmptyState>
        ) : <ItemGrid items={items} />}
      </main>
    </div>
  );
}
