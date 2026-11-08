import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "../lib/motion";
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
  const art = useRef<HTMLImageElement>(null), actions = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(art.current, { autoAlpha: 0, y: 30, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" })
      .fromTo(actions.current?.children ?? [], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, "-=0.35");
    return () => { tl.kill(); };
  }, []);
  return (
    <main className="flex min-h-full flex-col items-center justify-between bg-white pb-6 pt-safe">
      <h1 className="sr-only">אגורה · לתת זה לקבל · ברוכים הבאים</h1>
      <img ref={art} src="./assets/welcome-art.svg" alt="" width={402} height={745} fetchPriority="high" className="block h-auto w-full max-w-[402px] select-none" draggable={false} />
      <div ref={actions} className="-mt-1 flex w-full flex-col items-center gap-1 px-gutter">
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
