export default function Stat({ label, value }) {
  return (
    <div className="card stat">
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
    </div>
  );
}
