import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/projects', label: 'פרויקטים' },
  { to: '/about', label: 'אודות' },
  { to: '/contact', label: 'צור קשר' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-bone/90 backdrop-blur-sm shadow-[0_1px_0_0_#d9d3c4]' : ''
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <NavLink to="/" className="font-display text-xl tracking-tight" onClick={() => setOpen(false)}>
          תמר פינקל
        </NavLink>

        <nav className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm tracking-wide transition-colors hover:text-brass ${
                  isActive ? 'text-brass' : 'text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="תפריט"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`block h-px w-7 bg-ink transition-transform ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`block h-px w-7 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-px w-7 bg-ink transition-transform ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </div>

      <div
        className={`grid overflow-hidden bg-bone transition-[grid-template-rows] duration-500 md:hidden ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0">
          <nav className="flex flex-col gap-1 px-6 pb-6">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="border-t border-line py-4 text-lg"
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
