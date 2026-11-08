export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="tap inline-flex items-center justify-center"
    >
      <span className={`relative inline-block h-7 w-12 rounded-full transition-colors ${checked ? "bg-ink" : "bg-placeholder"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-1" : "left-6"}`} />
      </span>
    </button>
  );
}
