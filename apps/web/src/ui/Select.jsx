/** Select (native, styled). Props: label, error, id, options [{value,label}], placeholder, ...rest. forwardRef. */
import { forwardRef, useId } from 'react';
const Select = forwardRef(function Select({ label, error, id, options = [], placeholder, className = '', ...rest }, ref) {
  const auto = useId(); const sid = id || auto;
  return (
    <div className={className}>
      {label && <label htmlFor={sid} className="mb-1.5 block text-sm font-semibold">{label}</label>}
      <select ref={ref} id={sid} aria-invalid={!!error} aria-describedby={error ? `${sid}-e` : undefined} {...rest}
        className={`w-full rounded-sm border-2 bg-surface px-4 py-3 text-base focus-visible:outline-none focus-visible:shadow-ring ${error ? 'border-danger' : 'border-line focus:border-ink'}`}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p id={`${sid}-e`} className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
});
export default Select;
