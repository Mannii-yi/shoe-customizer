/** IconButton. Props: label (REQUIRED aria-label), size px (default 48), variant 'dark'|'light', children (icon), ...rest. */
export default function IconButton({ label, size = 48, variant = 'dark', className = '', children, ...rest }) {
  const v = variant === 'dark' ? 'bg-ink text-white hover:bg-blue' : 'bg-surface text-ink hover:bg-lime border border-line';
  return (
    <button type="button" aria-label={label} style={{ width: size, height: size }} {...rest}
      className={`inline-grid place-items-center rounded-full transition duration-200 focus-visible:outline-none focus-visible:shadow-ring disabled:opacity-50 ${v} ${className}`}>
      {children}
    </button>
  );
}
