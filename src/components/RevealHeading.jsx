import { useRef } from 'react'
import { Line, useRevealScroll } from './Lines.jsx'

export default function RevealHeading({ lines, tag: Tag = 'h2', className = '', lineClassName = 'block' }) {
  const ref = useRef(null)
  useRevealScroll(ref)

  return (
    <Tag ref={ref} className={className}>
      {lines.map((l, i) => (
        <Line key={i} className={lineClassName}>
          {l}
        </Line>
      ))}
    </Tag>
  )
}
