import { Link, useLocation } from 'react-router-dom'

export default function Footer() {
  const { pathname } = useLocation()
  if (pathname === '/contact') return null

  return (
    <footer className="border-t border-line px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <p className="font-display text-2xl md:text-3xl">נתחיל לתרגם חלומות למוצרים?</p>
        <Link
          to="/contact"
          className="shrink-0 rounded-full border border-ink px-8 py-3 text-sm tracking-wide transition-colors hover:bg-ink hover:text-bone"
        >
          נדבר?
        </Link>
      </div>
      <p className="mx-auto mt-8 max-w-7xl text-xs text-clay">© {new Date().getFullYear()} תמר פינקל — עיצוב מוצר תעשייתי</p>
    </footer>
  )
}
