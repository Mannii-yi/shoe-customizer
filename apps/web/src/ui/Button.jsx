/**
 * Button.
 * Props: variant 'primary'|'accent'|'outline'|'ghost' (default primary), size 'sm'|'md'|'lg', loading (bool: disables + spinner),
 *        disabled, as (element or Router Link, default 'button'), ...rest (onClick, to, type, aria-*).
 * Keyboard: native button; visible focus ring. */
import { forwardRef } from 'react';
import Spinner from './Spinner.jsx';
const V = {
  primary: 'bg-ink text-white hover:bg-blue',
  accent: 'bg-coral text-ink hover:brightness-95',
  outline: 'border-2 border-ink text-ink hover:bg-ink hover:text-white',
  ghost: 'text-ink hover:bg-black/5',
};
const S = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-sm', lg: 'px-8 py-4 text-base' };
const Button = forwardRef(function Button({ variant = 'primary', size = 'md', loading = false, disabled = false, as: As = 'button', className = '', children, ...rest }, ref) {
  const off = disabled || loading;
  const extra = As === 'button' ? { type: rest.type || 'button', disabled: off } : { 'aria-disabled': off || undefined };
  return (
    <As ref={ref} {...extra} {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:shadow-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${V[variant]} ${S[size]} ${className}`}>
      {loading && <Spinner size={16} />}
      {children}
    </As>
  );
});
export default Button;
