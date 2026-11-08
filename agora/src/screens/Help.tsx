import { Card } from "../components/Card";
import { Illustration } from "../components/Illustration";
import { TopBar } from "../components/TopBar";

const TIPS = [
  ["נפגשים בבטחה", "איסוף בכניסה לבניין או במקום ציבורי. אפשר לבוא עם עוד מישהו."],
  ["הכל בחינם", "באגורה לא משלמים. מי שמבקש כסף או פרטי אשראי, לא מתאים לכאן."],
  ["מדברים בתוך האפליקציה", "ההודעות נשמרות כאן. אין צורך לתת מספר טלפון."],
  ["חפץ נמסר?", "סמנו אותו כנמסר, כדי שאחרים לא יפנו לחינם."],
];

export default function Help() {
  return (
    <div className="min-h-full pb-8">
      <TopBar title="מסירה בטוחה" />
      <div className="flex flex-col items-center px-gutter pb-4 text-center">
        <Illustration name="verified" size={130} />
        <p className="mt-2 text-body">כמה כללים פשוטים, ומסירה עוברת בנעימים.</p>
      </div>
      <main className="space-y-3 px-gutter pt-2">
        {TIPS.map(([t, d]) => (
          <Card key={t} className="p-4"><h2 className="text-body font-demibold">{t}</h2><p className="mt-1 text-body">{d}</p></Card>
        ))}
      </main>
    </div>
  );
}
