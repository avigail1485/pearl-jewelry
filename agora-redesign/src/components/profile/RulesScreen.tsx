import TopBar from "../ui/TopBar"

const rules = [
  ["בחינם בלבד", "אגורה היא לוח למסירה ללא תמורה. אין מכירה, החלפה או בקשת מקדמה."],
  ["בלי שיחות בתשלום", "יוצרים קשר בהודעה בתוך האפליקציה. אף פעם לא דרך מספר 1-900."],
  ["פרטיות", "רק שם הישוב מוצג. הכתובת והטלפון נמסרים בהודעה, אחרי שהמוסר מאשר."],
  ["מודעות אמיתיות", "מצלמים את החפץ עצמו ומתארים את מצבו בכנות."],
  ["כבוד הדדי", "מגיעים בזמן שתואם, ומעדכנים אם משהו משתנה."],
]

export default function RulesScreen() {
  return (
    <div className="min-h-full bg-white">
      <TopBar title="כללי הקהילה" />
      <ol className="flex flex-col px-5 pb-8">
        {rules.map(([t, d], i) => (
          <li key={t} className="flex gap-4 border-b border-line py-4 last:border-b-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender text-[14px] font-bold text-blue-ink">{i + 1}</span>
            <div>
              <h2 className="text-[16px] font-bold">{t}</h2>
              <p className="text-[14px] text-ink-2">{d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
