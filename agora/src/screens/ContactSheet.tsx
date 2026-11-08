import { useEffect, useState } from "react";
import { startThread } from "../api/messages";
import type { Item } from "../api/types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { Sheet } from "../components/Sheet";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";

const PHRASES = ["אפשר לאסוף היום?", "אגיע עם רכב", "גמישים בזמנים", "אפשר לשמור לי?"];

export function ContactSheet({ open, onClose, item, onSent }: { open: boolean; onClose: () => void; item: Item; onSent: (threadId: string) => void }) {
  const { viewer, phoneVerified, verifyPhone } = useUser();
  const toast = useUI((s) => s.showToast);
  const [text, setText] = useState("");
  const [step, setStep] = useState<"msg" | "phone" | "code">("msg");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setText(`היי, ראיתי את ה${item.title} באגורה. הוא עדיין זמין? אשמח לאסוף.`); setStep("msg"); setCode(""); }
  }, [open, item.title]);

  const send = async () => {
    if (!viewer?.id) { toast("צריך להתחבר כדי לשלוח"); return; }
    setBusy(true);
    try {
      const tid = await startThread({
        me: viewer.id, itemId: item.id, itemTitle: item.title, sellerId: item.seller.id,
        demoSellerName: item.demo ? item.seller.name : undefined, text: text.trim(),
      });
      onSent(tid);
    } catch {
      toast("ההודעה לא נשלחה. נסו שוב.");
    } finally { setBusy(false); }
  };

  const phoneOk = /^0\d{8,9}$/.test(phone.replace(/[-\s]/g, ""));

  return (
    <Sheet open={open} onClose={onClose} label="פנייה למוסר">
      {step === "msg" && (
        <>
          <h2 className="text-section font-light">פנייה למוסר</h2>
          <label htmlFor="msg" className="mt-4 block text-meta text-ink/65">ההודעה שלכם</label>
          <textarea id="msg" rows={4} value={text} onChange={(e) => setText(e.target.value)} className="mt-1 w-full resize-none rounded-tile bg-gray-100 p-3 text-body" />
          <div className="no-scrollbar -mx-gutter mt-3 flex gap-2 overflow-x-auto px-gutter">
            {PHRASES.map((p) => <Chip key={p} onClick={() => setText((t) => `${t.trim()} ${p}`)}>{p}</Chip>)}
          </div>
          <p className="mt-4 text-meta text-ink/65">ההודעה נשלחת בתוך האפליקציה. בלי שיחות בתשלום.</p>
          <Button block className="mt-4" disabled={!text.trim() || busy} onClick={() => (phoneVerified ? send() : setStep("phone"))}>שליחת הודעה</Button>
        </>
      )}
      {step === "phone" && (
        <form onSubmit={(e) => { e.preventDefault(); if (phoneOk) setStep("code"); }}>
          <h2 className="text-section font-light">אימות טלפון</h2>
          <p className="mt-1 text-body">פעם אחת בלבד. כך שומרים על קהילה בטוחה. המספר לא מוצג לאף אחד.</p>
          <label htmlFor="tel" className="mt-4 block text-meta text-ink/65">מספר טלפון</label>
          <input id="tel" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="050-0000000" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-12 w-full rounded-search bg-gray-100 px-3 text-right text-body" />
          <Button type="submit" block className="mt-4" disabled={!phoneOk}>שליחת קוד</Button>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={async (e) => { e.preventDefault(); if (code.length === 4) { await verifyPhone(); await send(); } }}>
          <h2 className="text-section font-light">הקלידו את הקוד</h2>
          <p className="mt-1 text-body">שלחנו קוד בן 4 ספרות ל-<span dir="ltr">{phone}</span>.</p>
          <label htmlFor="otp" className="sr-only">קוד אימות</label>
          <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={4} dir="ltr" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="mt-4 h-14 w-full rounded-search bg-gray-100 text-center text-section tracking-[.5em]" />
          <p className="mt-2 text-meta text-ink/65">בגרסת ההדגמה כל קוד בן 4 ספרות מתקבל.</p>
          <Button type="submit" block className="mt-4" disabled={code.length !== 4 || busy}>אימות ושליחה</Button>
          <Button variant="link" className="mt-1 w-full" onClick={() => setStep("phone")}>שינוי מספר</Button>
        </form>
      )}
    </Sheet>
  );
}
