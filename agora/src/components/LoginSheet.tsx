import { Mail } from "lucide-react";
import { useState } from "react";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";
import { Button } from "./Button";
import { GoogleIcon } from "./Icon";
import { Illustration } from "./Illustration";
import { Sheet } from "./Sheet";

export function LoginSheet() {
  const { login, closeLogin, showToast } = useUI();
  const signIn = useUser((s) => s.signIn);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    const ok = await signIn();
    setBusy(false);
    if (!ok) { showToast("לא הצלחנו לזהות את החשבון. נסו שוב."); return; }
    const done = login.onDone;
    closeLogin();
    showToast("התחברתם בהצלחה");
    done?.();
  };
  return (
    <Sheet open={login.open} onClose={closeLogin} label="התחברות">
      <div className="flex flex-col items-center text-center">
        <Illustration name="verified" size={130} />
        <h2 className="mt-3 text-title font-demibold">רגע לפני שממשיכים</h2>
        <p className="mt-1 text-body">כדי לפנות למוסרים או לפרסם חפץ צריך להתחבר. זה לוקח שנייה.</p>
        <div className="mt-6 flex w-full flex-col gap-3">
          <Button variant="secondary" block disabled={busy} icon={<GoogleIcon />} onClick={go}>המשך עם Google</Button>
          <Button variant="primary" block disabled={busy} icon={<Mail size={20} strokeWidth={1.75} />} onClick={go}>המשך עם אימייל</Button>
        </div>
      </div>
    </Sheet>
  );
}
