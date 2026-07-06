import { useLayoutEffect } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap.js'

/** Wrap a single line of text: outer clips, inner carries the transform. */
export function Line({ children, className = '' }) {
  return (
    <span className={`line-mask ${className}`}>
      <span className="line-inner">{children}</span>
    </span>
  )
}

function animate(container, { stagger, delay }) {
  const inners = container.querySelectorAll('.line-inner')
  gsap.set(inners, { yPercent: 110, opacity: 0 })
  gsap.to(inners, {
    yPercent: 0,
    opacity: 1,
    duration: 1.2,
    ease: 'power4.out',
    stagger,
    delay,
  })
}

/** Reveal all .line-inner children immediately on mount — for hero copy. */
export function useRevealMount(ref, { stagger = 0.1, delay = 0.2 } = {}) {
  useLayoutEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => animate(ref.current, { stagger, delay }))
    return () => ctx.revert()
  }, [])
}

/** Reveal all .line-inner children once the container scrolls into view. */
export function useRevealScroll(ref, { stagger = 0.1, start = 'top 82%' } = {}) {
  useLayoutEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: ref.current,
        start,
        once: true,
        onEnter: () => animate(ref.current, { stagger, delay: 0 }),
      })
      return () => trigger.kill()
    }, ref)
    return () => ctx.revert()
  }, [])
}
