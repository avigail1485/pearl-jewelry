import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/gsap.js'
import RevealHeading from '../components/RevealHeading.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import { projects } from '../data/content.js'

export default function Projects() {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const track = trackRef.current

      const build = () => {
        const totalWidth = track.scrollWidth - window.innerWidth
        return gsap.to(track, {
          x: -totalWidth,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: () => `+=${totalWidth}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
      }
      build()
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-40 md:px-10">
        <RevealHeading
          tag="p"
          lines={[
            'לפני הכל – לכל מוצר יש סיפור. אולי יש כאלו שיראו בו סתם חפץ, אבל אותי הוא מצית בסקרנות.',
          ]}
          className="font-display text-2xl leading-snug md:text-4xl"
        />
        <RevealHeading
          tag="p"
          lines={[
            'אני קולטת את הצורך, מרותקת לתהליכי הפיתוח והתכנון, ומתחילה לשרטט את השלב הבא של הרעיון שלך.',
            'המוצר שלך הולך לספר סיפור של חדשנות.',
          ]}
          className="mt-6 text-lg leading-relaxed text-ink/70"
        />
      </section>

      <section ref={sectionRef} className="relative h-screen overflow-hidden">
        <div className="absolute right-6 top-10 z-10 font-display text-3xl md:right-10 md:text-4xl">
          #הפרויקטים
        </div>
        <div ref={trackRef} className="flex h-full w-max items-center gap-10 px-6 pt-16 md:gap-16 md:px-10">
          {projects.map((project) => (
            <div key={project.id} className="w-[82vw] shrink-0 sm:w-[55vw] md:w-[38vw]">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
