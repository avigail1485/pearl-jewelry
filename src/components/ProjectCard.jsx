import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/gsap.js'

export default function ProjectCard({ project }) {
  const cardRef = useRef(null)
  const imgRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        { scale: 1.3, opacity: 0 },
        {
          scale: 1.05,
          opacity: 1,
          duration: 1.3,
          ease: 'power3.out',
          scrollTrigger: { trigger: cardRef.current, start: 'top 85%', once: true },
        },
      )
      gsap.to(imgRef.current, {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, cardRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={cardRef}>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-line">
        <img
          ref={imgRef}
          src={project.image}
          alt={project.title}
          className="h-[120%] w-full object-cover"
        />
      </div>
      <div className="mt-5 flex items-baseline justify-between">
        <h3 className="font-display text-2xl md:text-3xl">{project.title}</h3>
        <span className="text-sm text-clay">{project.year}</span>
      </div>
      <p className="mt-1 text-ink/60">{project.tagline}</p>
    </div>
  )
}
