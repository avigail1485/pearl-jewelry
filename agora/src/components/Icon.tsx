// Project-specific icons from assets/icons (not in lucide).
export function GoogleIcon({ size = 20 }: { size?: number }) {
  return <img src="./assets/icons/google.svg" width={size} height={size} alt="" aria-hidden />;
}
export function StairsIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 20h5v-4h4v-4h4V8h5" /><path d="M3 20h18" />
    </svg>
  );
}
export function HeartFilled({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#92FF5F" stroke="#1E1E1E" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
export function Pinwheel({ size = 24, color = "#92FF5F" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 57.1944 57.1945" fill="none" aria-hidden>
      <path d="M28.5972 28.5972H0V0C7.58445 0 14.8583 3.01291 20.2213 8.37593C25.5843 13.7389 28.5972 21.0128 28.5972 28.5972Z" fill={color} />
      <path d="M57.1944 0H28.5972V28.5972C36.1817 28.5972 43.4555 25.5843 48.8185 20.2213C54.1815 14.8583 57.1944 7.58446 57.1944 0Z" fill={color} />
      <path d="M0 57.1944H28.5972V28.5972C21.0128 28.5972 13.739 31.6101 8.37594 36.9732C3.01292 42.3362 0 49.61 0 57.1944Z" fill={color} />
      <path d="M28.5972 28.5972H57.1944V57.1944C49.61 57.1944 42.3362 54.1815 36.9731 48.8185C31.6101 43.4555 28.5972 36.1817 28.5972 28.5972Z" fill={color} />
    </svg>
  );
}
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Pinwheel size={size} />
      <span className="text-section font-demibold leading-none">אגורה</span>
    </span>
  );
}
