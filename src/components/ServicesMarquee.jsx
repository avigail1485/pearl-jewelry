import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/gsap.js'
import { services } from '../data/content.js'

export default function ServicesMarquee() {
  const trackRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const track = trackRef.current
      const width = track.scrollWidth / 2
      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: -width,
          duration: 28,
          ease: 'none',
          repeat: -1,
        },
      )
    }, trackRef)
    return () => ctx.revert()
  }, [])

  const items = [...services, ...services]

  return (
    <section className="border-y border-line py-10">
      <div ref={trackRef} className="marquee-track">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-8 px-8">
            <span className="whitespace-nowrap font-display text-3xl md:text-5xl">{item}</span>
            <span className="h-2 w-2 rounded-full bg-brass" />
          </div>
        ))}
      </div>
    </section>
  )
}
