/** AppLayout: use as a layout route (<Route element={<AppLayout user cartCount/>}> ... children render in an <Outlet/>) or wrap a page.
 * Props: cartCount, user, flush (default: true on "/"), promo (fixed bottom promo bar, default true). Provides ToastProvider, skip link, Navbar, route-change fade, Footer.
 * Props: cartCount, user (see Navbar), flush (bool: no top padding, for the landing page whose stage sits under the bar). Dev D wraps routes with it. */
import { Outlet, useLocation } from 'react-router-dom';
import '../styles/tokens.css'; // design tokens load with the layout, so index.css needs no edit
import { ToastProvider } from '../ui/Toast.jsx';
import PromoBar from '../ui/PromoBar.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
export default function AppLayout({ children, cartCount = 0, user = null, flush, promo = true }) {
  const { pathname } = useLocation();
  const noPad = flush ?? pathname === '/';
  return (
    <ToastProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-lime focus:px-4 focus:py-2 focus:font-bold">Skip to content</a>
      <Navbar cartCount={cartCount} user={user} />
      <main id="main" key={pathname} className={`route-fade min-h-screen ${noPad ? '' : 'pt-[72px]'}`}>{children ?? <Outlet />}</main>
      <Footer />
      {promo && <PromoBar />}
    </ToastProvider>
  );
}
