export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 51 51" fill="none" aria-hidden="true">
      <path d="M25.5 25.5H0V0C6.76302 0 13.2491 2.68659 18.0312 7.46877C22.8134 12.2509 25.5 18.737 25.5 25.5Z" fill="#00B46E" />
      <path d="M51 0H25.5V25.5C32.263 25.5 38.749 22.8134 43.5312 18.0312C48.3134 13.249 51 6.76302 51 0Z" fill="#FF7A1A" />
      <path d="M0 51H25.5V25.5C18.737 25.5 12.251 28.1866 7.46878 32.9688C2.68661 37.751 0 44.237 0 51Z" fill="#FF7A1A" />
      <path d="M25.5 25.5H51V51C44.237 51 37.7509 48.3134 32.9688 43.5312C28.1866 38.7491 25.5 32.263 25.5 25.5Z" fill="#00B46E" />
    </svg>
  )
}
