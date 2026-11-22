/** Spinner. Props: size (px, default 20), label (screen-reader text, default "Loading"). */
export default function Spinner({ size = 20, label = 'Loading' }) {
  return (
    <span role="status" className="inline-flex">
      <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity=".25" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
