import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { BackButton } from "../components/TopBar";

export default function MessageSent() {
  const { tid = "" } = useParams();
  const nav = useNavigate();
  return (
    <main className="flex min-h-full flex-col pt-safe">
      <div className="px-3 pt-2"><BackButton /></div>
      <div className="flex flex-1 items-center">
        <EmptyState name="message-sent" size={190} title="ההודעה נשלחה" text="המוסר יקבל את ההודעה ויחזור אליכם כאן, בהודעות.">
          <Button block onClick={() => nav(`/chat/${tid}`, { replace: true })}>מעבר לשיחה</Button>
          <Button variant="link" onClick={() => nav("/", { replace: true })}>חזרה לחפצים</Button>
        </EmptyState>
      </div>
    </main>
  );
}
