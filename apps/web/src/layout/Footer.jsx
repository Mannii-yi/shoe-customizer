/** Footer (black). No props. Demo-store text is deliberate: checkout is a MOCK. */
import { Link } from 'react-router-dom';
export default function Footer() {
  return (
    <footer className="bg-ink px-[7vw] pb-24 pt-20 text-white">
      <div className="mx-auto grid max-w-[1400px] gap-12 sm:grid-cols-3">
        <div><p className="mb-4 font-display text-3xl text-lime">RUNNER</p><p className="leading-relaxed text-white/70">Made-to-order sneakers, designed by you.</p></div>
        <div><p className="mb-4 font-display text-3xl text-lime">Shop</p><ul className="space-y-3 text-white/70"><li><Link className="hover:text-white" to="/customize">Customize</Link></li><li><Link className="hover:text-white" to="/designs">My designs</Link></li><li><Link className="hover:text-white" to="/orders">Orders</Link></li></ul></div>
        <div><p className="mb-4 font-display text-3xl text-lime">Help</p><p className="leading-relaxed text-white/70">Demo store. No real payments are taken.</p></div>
      </div>
    </footer>
  );
}
