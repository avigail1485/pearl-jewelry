import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { GoogleIcon } from "../components/Icon";
import { useUser } from "../store/user";
import { useUI } from "../store/ui";

/** Opening screen, drawn from the designer's welcome-screen.svg (characters move gently). */
export default function Welcome() {
  const nav = useNavigate();
  const { signIn, markWelcomed } = useUser();
  const toast = useUI((s) => s.showToast);
  const finish = () => { markWelcomed(); nav("/", { replace: true }); };
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-between bg-white pb-6 pt-safe">
      <h1 className="sr-only">אגורה · לתת זה לקבל · ברוכים הבאים</h1>
      <img src="./assets/welcome-art.svg" alt="" width={402} height={745} fetchPriority="high" className="block h-auto w-full max-w-[402px] select-none" draggable={false} />
      <div className="-mt-1 flex w-full flex-col items-center gap-1 px-gutter">
        <Button
          variant="secondary"
          className="w-[260px] !h-11 !font-light"
          icon={<GoogleIcon />}
          onClick={async () => { if (await signIn()) { toast("התחברתם בהצלחה"); finish(); } else toast("לא הצלחנו לזהות את החשבון. נסו שוב."); }}
        >
          התחברות עם גוגל
        </Button>
        <Button variant="link" className="!font-light" onClick={finish}>דילוג</Button>
      </div>
    </main>
  );
}
