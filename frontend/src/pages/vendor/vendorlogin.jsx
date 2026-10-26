
import { useState } from "react";
import { Link, useNavigate } from "react-router";

function VendorLogin() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your email/mobile number and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/vendor/login/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: identifier.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Vendor login failed.");
        return;
      }

      // Save the vendor login state and API response.
      localStorage.setItem("yumoraVendor", JSON.stringify(data));
      localStorage.setItem("yumoraLoggedIn", "true");

      // Keep vendor and customer sessions separate.
      localStorage.removeItem("yumoraCustomerLoggedIn");

      // Save a consistent user object for the navbar.
      const vendorUser = {
        ...data,
        role: "vendor",
        business_name:
          data.business_name ||
          data.businessName ||
          data.vendor?.business_name ||
          data.vendor?.businessName ||
          data.restaurant?.name ||
          data.username ||
          identifier.trim(),
        username: data.username || identifier.trim(),
        email: data.email || identifier.trim(),
      };

      localStorage.setItem("yumoraUser", JSON.stringify(vendorUser));

      if (data.is_approved === false) {
        alert(
          "Login successful!\n\nYour vendor account is waiting for admin approval.\n\nYou can access your dashboard, but you cannot add restaurants or food items until the admin approves your account."
        );
      }

      // Notify navbar listeners and open the dashboard.
      window.dispatchEvent(new Event("storage"));
      navigate("/vendor/dashboard");
    } catch (err) {
      console.error("Vendor login error:", err);

      setError(
        "Cannot connect to the server. Please make sure Django is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-brand">Yumora Partner</div>

          <h1>
            Grow your
            <br />
            restaurant.
          </h1>

          <p>
            Sign in to manage your restaurant, menu, and orders.
          </p>

          <div className="auth-food-icons">🍕 🍔 🍛 🍜</div>
        </div>

        <div className="auth-card">
          <h2>Vendor Login</h2>

          <p className="auth-subtitle">
            Sign in to your restaurant owner account
          </p>

          <form onSubmit={handleSubmit}>
            <label>Email or Mobile Number</label>

            <input
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError("");
              }}
              placeholder="Enter your email or mobile number"
              autoComplete="username"
            />

            <label>Password</label>

            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <p
                style={{
                  color: "#e23744",
                  fontSize: 14,
                  margin: "8px 0",
                }}
              >
                {error}
              </p>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Vendor Login"}
            </button>
          </form>

          <p className="register-text">
            New restaurant partner?
            <Link
              to="/vendor/register"
              style={{
                marginLeft: 6,
                color: "#16a34a",
                fontWeight: 700,
              }}
            >
              Register here
            </Link>
          </p>

          <p className="register-text">
            <Link to="/login">Customer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default VendorLogin;
