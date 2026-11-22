/** Navbar (black bar, matches Footer). Props: cartCount (number, default 0), user ({name}|null). Dev D passes these from sessionStore/cart data
 * (Navbar never imports Dev D code). Links: Customize, Designs, Cart, Account. Keyboard accessible, current page marked with aria-current. */
import { Link, NavLink } from 'react-router-dom';
const link = ({ isActive }) => `rounded-full px-3 py-1.5 text-sm font-semibold transition hover:text-lime focus-visible:outline-none focus-visible:shadow-ring ${isActive ? 'text-lime' : 'text-white'}`;
export default function Navbar({ cartCount = 0, user = null }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-ink text-white">
      <nav aria-label="Main" className="mx-auto flex max-w-[1400px] items-center justify-between px-[5vw] py-4">
        <Link to="/" className="font-display text-2xl tracking-wide focus-visible:outline-none focus-visible:shadow-ring">RUNNER</Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <NavLink to="/customize" className={link}>Customize</NavLink>
          <NavLink to="/designs" className={link}>My designs</NavLink>
          <NavLink to="/cart" className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink focus-visible:outline-none focus-visible:shadow-ring">Bag ({cartCount})</NavLink>
          <NavLink to={user ? '/orders' : '/login'} className={link}>{user ? user.name : 'Log in'}</NavLink>
        </div>
      </nav>
    </header>
  );
}
