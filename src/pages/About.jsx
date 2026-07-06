import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/gsap.js'
import RevealHeading from '../components/RevealHeading.jsx'

const paragraphs = [
  'מעצבת מוצר תעשייתית שמבינה בדיוק את המשתמש ויודעת לייצר עיצוב חכם, נקי ואסתטי.',
  'חומרים, צורות ופתרונות הם הכלים שלי לעצב מציאות.',
  'החיבור העמוק שלי לעולמות האמנות, הגרפיקה, האיור והצורפות, מאפשר לי לראות מוצרים מזווית אחרת, רחבה ועשירה יותר.',
  'כדי לדעת איך יוצרים מוצרים שעובדים, אני חוקרת, מנתחת ומדייקת את חוויית המשתמש עד לפרט האחרון. השאיפה שלי למצוא את הפתרונות הנכונים ביותר ולשלב רעיונות חדשניים ותואמים לקהל היעד.',
  'העבודה איתי מתאפיינת בקו נקי וחדשני, לצד התנהלות יסודית, אחראית, נעימה וזורמת משלב הרעיון הראשוני ועד למוצר המוגמר.',
  'שואפת לשלמות. הכל כדי שהמוצר שלכם יהפוך לשחקן מוביל!',
]

export default function About() {
  const imgWrapRef = useRef(null)
  const imgRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        { scale: 1.3 },
        {
          scale: 1.05,
          duration: 1.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: imgWrapRef.current, start: 'top 80%', once: true },
        },
      )
      gsap.to(imgRef.current, {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: {
          trigger: imgWrapRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, imgWrapRef)
    return () => ctx.revert()
  }, [])

  return (
    <main className="mx-auto max-w-7xl px-6 pb-28 pt-40 md:px-10">
      <RevealHeading
        tag="p"
        lines={['הגיע זמן היצירה :) נתחיל?']}
        className="text-sm tracking-[0.3em] text-clay"
      />
      <RevealHeading
        tag="h1"
        lines={['נעים להכיר, תמר']}
        className="mt-4 font-display text-5xl leading-tight md:text-7xl"
      />

      <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
        <div
          ref={imgWrapRef}
          className="relative aspect-[4/5] w-full overflow-hidden bg-line md:sticky md:top-32 md:h-[70vh]"
        >
          <img
            ref={imgRef}
            src="/images/work/photography.jpg"
            alt="תמר פינקל בסטודיו"
            className="h-[120%] w-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-7">
          {paragraphs.map((p, i) => (
            <RevealHeading
              key={i}
              tag="p"
              lines={[p]}
              className="text-lg leading-relaxed text-ink/80 md:text-xl"
            />
          ))}
        </div>
      </div>
    </main>
  )
}
