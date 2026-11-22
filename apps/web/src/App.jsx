import { Routes, Route } from 'react-router-dom';

import AppLayout from './layout/AppLayout';
import Landing from './pages/Landing';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Customizer from './pages/Customizer';
import Designs from './pages/Designs';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';

import SharedDesign from './pages/SharedDesign';
import NotFound from './pages/NotFound';

import UiKitchenSink from './ui/dev/UiKitchenSink';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Landing />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />

        <Route path="/customize" element={<Customizer />} />
        <Route path="/designs" element={<Designs />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />

        <Route path="/shared/:token" element={<SharedDesign />} />

        {import.meta.env.DEV && (
          <Route path="/dev/ui" element={<UiKitchenSink />} />
        )}

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
