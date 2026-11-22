/** Container. Props: size 'md'|'lg'|'xl' (max width 768/1100/1400), as (default 'div'). Horizontal padding scales with viewport. */
const W = { md: 'max-w-3xl', lg: 'max-w-[1100px]', xl: 'max-w-[1400px]' };
export default function Container({ size = 'lg', as = 'div', className = '', children }) {
  const As = as;
  return <As className={`mx-auto w-full px-[5vw] ${W[size]} ${className}`}>{children}</As>;
}
