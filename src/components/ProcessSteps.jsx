import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap.js'
import { processSteps } from '../data/content.js'

export default function ProcessSteps() {
  const sectionRef = useRef(null)
  const cardsRef = useRef([])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current
      gsap.set(cards, { yPercent: 100 })
      gsap.set(cards[0], { yPercent: 0 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * (cards.length - 1)}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      cards.forEach((card, i) => {
        if (i === 0) return
        tl.to(card, { yPercent: 0, ease: 'none' }, i - 1)
        tl.to(
          cards[i - 1].querySelector('.process-inner'),
          { scale: 0.94, opacity: 0.5, ease: 'none' },
          i - 1,
        )
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative h-[100svh] overflow-hidden bg-ink text-bone"
    >
      {processSteps.map((step, i) => (
        <div
          key={step.index}
          ref={(el) => (cardsRef.current[i] = el)}
          className="absolute inset-0"
          style={{ zIndex: i + 1 }}
        >
          <div className="process-inner grid h-full grid-cols-1 items-center gap-10 bg-ink px-6 pt-24 md:grid-cols-2 md:px-16 md:pt-0">
            <div>
              <span className="font-display text-6xl text-brass md:text-8xl">{step.index}</span>
              <p className="mt-2 text-xs tracking-[0.3em] text-bone/50">
                {step.enTitle.toUpperCase()}
              </p>
              <h3 className="font-display mt-6 text-3xl leading-tight md:text-5xl">{step.title}</h3>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-bone/70 md:text-lg">
                {step.body}
              </p>
            </div>
            <div className="relative aspect-[4/5] w-full overflow-hidden md:aspect-auto md:h-[70vh]">
              <img src={step.image} alt={step.title} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
