import { useRef } from 'react'
import { Line, useRevealMount } from './Lines.jsx'
import { getLenis } from '../hooks/useSmoothScroll.js'

export default function Hero() {
  const ref = useRef(null)
  useRevealMount(ref, { stagger: 0.1, delay: 0.3 })

  const scrollToProcess = (e) => {
    e.preventDefault()
    const el = document.getElementById('process')
    if (el) getLenis()?.scrollTo(el, { offset: 0 })
  }

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pb-20 pt-36 md:px-10"
    >
      <Line className="mb-8 text-sm tracking-[0.35em] text-clay">
        תמר פינקל — עיצוב מוצר תעשייתי
      </Line>

      <h1 className="font-display leading-[0.92]">
        <Line className="block text-[15vw] md:text-[7.5vw]">המוצר שלך</Line>
        <Line className="block text-[15vw] text-brass md:text-[7.5vw]">שחקן מוביל</Line>
      </h1>

      <div className="mt-10 max-w-xl font-body text-lg leading-relaxed text-ink/80 md:text-xl">
        <Line className="block">כדי להפוך את הרעיון שלך למוצר שכולם ירצו,</Line>
        <Line className="block">כזה שיבלוט בשוק וייתן ערך אמיתי,</Line>
        <Line className="block">הוא צריך עיצוב חכם, פונקציונלי ומדויק</Line>
        <Line className="block">שישדרג את חוויית המשתמש וייתן פתרון מנצח.</Line>
      </div>

      <div className="mt-12 overflow-hidden">
        <span className="line-inner inline-block">
          <a
            href="#process"
            onClick={scrollToProcess}
            className="inline-block rounded-full bg-ink px-10 py-4 text-sm tracking-wide text-bone transition-colors duration-300 hover:bg-brass"
          >
            תראי לי איך
          </a>
        </span>
      </div>
    </section>
  )
}
