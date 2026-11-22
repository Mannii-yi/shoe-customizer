/** Input (works with react-hook-form: spread register()). Props: label, hint, error (string), id, ...rest (type, placeholder, disabled...). forwardRef. */
import { forwardRef, useId } from 'react';
const Input = forwardRef(function Input({ label, hint, error, id, className = '', ...rest }, ref) {
  const auto = useId(); const iid = id || auto; const d = error ? `${iid}-e` : hint ? `${iid}-h` : undefined;
  return (
    <div className={className}>
      {label && <label htmlFor={iid} className="mb-1.5 block text-sm font-semibold">{label}</label>}
      <input ref={ref} id={iid} aria-invalid={!!error} aria-describedby={d} {...rest}
        className={`w-full rounded-sm border-2 bg-surface px-4 py-3 text-base transition focus-visible:outline-none focus-visible:shadow-ring disabled:opacity-50 ${error ? 'border-danger' : 'border-line focus:border-ink'}`} />
      {error ? <p id={d} className="mt-1.5 text-sm text-danger">{error}</p> : hint ? <p id={d} className="mt-1.5 text-sm text-muted">{hint}</p> : null}
    </div>
  );
});
export default Input;
