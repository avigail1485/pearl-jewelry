import { LocateFixed } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CITIES } from "../lib/categories";
import { detectCity } from "../lib/locate";
import { ls } from "../lib/storage";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";
import { Button } from "./Button";
import { Illustration } from "./Illustration";
import { Sheet } from "./Sheet";

/** Asked once, after the welcome screen: find the person's area so "near you" works. */
export function LocationPrompt() {
  const { welcomed, city, setCity } = useUser();
  const toast = useUI((s) => s.showToast);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState(city);

  useEffect(() => {
    if (welcomed && pathname === "/" && !ls.get("agora.locAsked", false)) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [welcomed, pathname]);

  const done = () => { ls.set("agora.locAsked", true); setOpen(false); };
  const allow = async () => {
    setBusy(true);
    const c = await detectCity();
    setBusy(false);
    if (c) { setCity(c); toast(`זיהינו: ${c}`); done(); }
    else setManual(true);
  };

  return (
    <Sheet open={open} onClose={done} label="זיהוי מיקום">
      <div className="flex flex-col items-center text-center">
        <Illustration name="community" size="full" />
        <h2 className="mt-4 text-title font-demibold">{manual ? "באיזה יישוב אתם?" : "נזהה איפה אתם?"}</h2>
        <p className="mt-1 text-body">
          {manual ? "לא הצלחנו לזהות את המיקום. בחרו יישוב ונראה לכם חפצים קרובים." : "כדי להראות לכם חפצים קרובים ואת המרחק לכל אחד, צריך לאשר זיהוי מיקום. המיקום המדויק לא נשמר."}
        </p>
        {manual ? (
          <div className="mt-5 w-full">
            <label htmlFor="loc-city" className="sr-only">יישוב</label>
            <select id="loc-city" value={pick} onChange={(e) => setPick(e.target.value)} className="h-12 w-full rounded-btn bg-gray-100 px-3 text-body">
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button block className="mt-3" onClick={() => { setCity(pick); done(); }}>שמירה</Button>
          </div>
        ) : (
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button block disabled={busy} icon={<LocateFixed size={20} strokeWidth={1.75} />} onClick={allow}>{busy ? "מזהים…" : "אישור זיהוי מיקום"}</Button>
            <Button variant="link" onClick={() => setManual(true)}>אבחר יישוב בעצמי</Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
