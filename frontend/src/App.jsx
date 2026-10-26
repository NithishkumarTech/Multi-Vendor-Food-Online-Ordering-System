import { Routes, Route } from "react-router";

import Header from "./components/header";
import Footer from "./components/footer";

import Home from "./pages/home";
import RestaurantDetails from "./pages/Restaurantdetails";
import Login from "./pages/login";
import Register from "./pages/register";
import Cart from "./pages/cart";
import Orders from "./pages/orders";
import Offers from "./pages/offers";
import Checkout from "./pages/checkout";

import VendorWelcome from "./pages/vendor/vendorwelcome";
import VendorDashboard from "./pages/vendor/vendordashboard";
import VendorLogin from "./pages/vendor/vendorlogin";
import VendorRegister from "./pages/vendor/vendorregister";
import AddFoodItem from "./pages/vendor/addfooditem";

function App() {
  return (
    <>
      <Header />

      <Routes>
        {/* Customer pages */}
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<Home />} />

        <Route
          path="/restaurants/:restaurantId"
          element={<RestaurantDetails />}
        />

        {/* Customer authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer shopping */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* Vendor workflow */}
        <Route path="/vendor" element={<VendorWelcome />} />
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/register" element={<VendorRegister />} />
        <Route
          path="/vendor/dashboard"
          element={<VendorDashboard />}
        />
        <Route path="/vendor/add-food" element={<AddFoodItem />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;