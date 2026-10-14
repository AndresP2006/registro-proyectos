export default function ProgressBar({ value, label = false }: { value: number; label?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="bar-wrap">
      <div className="bar" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="bar-fill" style={{ width: `${v}%` }} />
      </div>
      {label && <span className="bar-label">{v}%</span>}
    </div>
  );
}
