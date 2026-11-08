export function ProgressBar({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`שלב ${step} מתוך ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1 flex-1 rounded-full ${i < step ? "bg-ink" : "bg-gray-100"}`} />
      ))}
    </div>
  );
}
