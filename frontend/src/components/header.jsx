
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("yumoraUser");
    const customerLoggedIn =
      localStorage.getItem("yumoraCustomerLoggedIn") === "true";
    const vendorLoggedIn =
      localStorage.getItem("yumoraLoggedIn") === "true";

    let userData = null;

    if (savedUser) {
      try {
        userData = JSON.parse(savedUser);
      } catch {
        userData = null;
      }
    }

    if (vendorLoggedIn) {
      setIsVendor(true);
      setUser(userData);
    } else if (customerLoggedIn) {
      setIsVendor(false);
      setUser(userData);
    } else {
      setIsVendor(false);
      setUser(null);
    }
  }, [location]);

  const handleLogout = async () => {
    if (isVendor) {
      try {
        await fetch("http://127.0.0.1:8000/api/vendor/logout/", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Vendor logout request failed:", error);
      }
    }

    localStorage.removeItem("yumoraLoggedIn");
    localStorage.removeItem("yumoraCustomerLoggedIn");
    localStorage.removeItem("yumoraUser");

    setUser(null);
    setIsVendor(false);

    navigate("/");
  };

  const displayName = isVendor
    ? user?.business_name ||
      user?.businessName ||
      user?.name ||
      user?.username ||
      "Vendor"
    : user?.name || user?.username || user?.email || "Customer";

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          Yumora
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/restaurants">Restaurants</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/orders">My Orders</Link>

          {!isVendor && (
            <Link to="/vendor" className="become-vendor-button">
              Become a Vendor
            </Link>
          )}
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              {isVendor ? (
                <Link
                  to="/vendor/dashboard"
                  className="user-name"
                  title="Open Vendor Dashboard"
                >
                  👤 {displayName}
                </Link>
              ) : (
                <span className="user-name">👤 {displayName}</span>
              )}

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="login-button">
              Login
            </Link>
          )}

          <Link to="/cart" className="cart-button">
            🛒 Cart
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

