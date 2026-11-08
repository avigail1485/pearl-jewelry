import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";

export default function Published() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  return (
    <main className="flex min-h-full items-center justify-center pt-safe">
      <EmptyState name="published" size={190} title="החפץ פורסם" text="תודה שאתם נותנים. נעדכן אתכם כשמישהו יפנה.">
        <Button block onClick={() => nav(`/item/${id}`, { replace: true })}>לצפייה בחפץ</Button>
        <Button variant="link" onClick={() => nav("/give", { replace: true })}>למסור עוד חפץ</Button>
      </EmptyState>
    </main>
  );
}
