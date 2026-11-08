import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { GoogleIcon, Logo } from "../components/Icon";
import { Illustration } from "../components/Illustration";
import { useUser } from "../store/user";
import { useUI } from "../store/ui";

export default function Welcome() {
  const nav = useNavigate();
  const { signIn, markWelcomed } = useUser();
  const toast = useUI((s) => s.showToast);
  const finish = () => { markWelcomed(); nav("/", { replace: true }); };
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-between px-gutter pb-8 pt-safe">
      <div className="flex flex-1 items-center justify-center pt-6">
        <Illustration name="welcome" size={260} eager />
      </div>
      <div className="flex w-full flex-col items-center gap-2">
        <h1 className="sr-only">אגורה</h1>
        <Logo size={48} />
        <p className="text-section font-light">לתת זה לקבל</p>
        <Button
          variant="secondary"
          className="mt-4 w-full max-w-[322px]"
          icon={<GoogleIcon />}
          onClick={async () => { if (await signIn()) { toast("התחברתם בהצלחה"); finish(); } else toast("לא הצלחנו לזהות את החשבון. נסו שוב."); }}
        >
          התחברות עם גוגל
        </Button>
        <Button variant="link" onClick={finish}>דילוג</Button>
      </div>
    </main>
  );
}
