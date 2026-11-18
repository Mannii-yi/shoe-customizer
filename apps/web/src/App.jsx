import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Customizer from './pages/Customizer';
import Designs from './pages/Designs';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import NotFound from './pages/NotFound';
import SharedDesign from './pages/SharedDesign';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/customize" element={<Customizer />} />
      <Route path="/designs" element={<Designs />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/orders" element={<Orders />} />

      <Route path="/shared/:token" element={<SharedDesign />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;