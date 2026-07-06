import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from '../lib/gsap.js'
import { getLenis } from './useSmoothScroll.js'

export function useRouteReset() {
  const { pathname } = useLocation()

  useEffect(() => {
    const lenis = getLenis()
    lenis?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pathname])
}
