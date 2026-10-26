import { useState } from "react";
import { Link, useNavigate } from "react-router";

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    if (!name || !email || !phone || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    // Keep this consistent with customer_register in accounts/views.py.
    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions to continue.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/accounts/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            `Registration failed (HTTP ${response.status}). Please check your details and try again.`
        );
        return;
      }

      if (!data.user) {
        setError(
          "Your account may have been created, but the server did not return customer details. Please try logging in."
        );
        return;
      }

      // Store only non-sensitive customer details; never store the password.
      localStorage.setItem("yumoraUser", JSON.stringify(data.user));
      localStorage.setItem("yumoraCustomerLoggedIn", "true");
      localStorage.removeItem("yumoraLoggedIn");

      navigate("/");
    } catch (err) {
      setError(
        "Unable to connect to Yumora. Make sure Django and the React frontend are running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-brand">Yumora</div>

          <h1>
            Your food.
            <br />
            Your way.
          </h1>

          <p>
            Create your Yumora account and discover delicious food from your
            favorite restaurants.
          </p>

          <div className="auth-food-icons">🍕 🍔 🍛 🍜</div>
        </div>

        <div className="auth-card">
          <h2>Create Account 🎉</h2>

          <p className="auth-subtitle">
            Join Yumora and start ordering delicious food.
          </p>

          <form onSubmit={handleRegister}>
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />

            <label htmlFor="register-email">Email Address</label>
            <input
              id="register-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <label htmlFor="register-phone">Mobile Number</label>
            <input
              id="register-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your mobile number"
              autoComplete="tel"
              maxLength={15}
              required
            />

            <label htmlFor="register-password">Password</label>
            <div className="password-input">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (at least 8 characters)"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label htmlFor="register-confirm-password">Confirm Password</label>
            <div className="password-input">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((shown) => !shown)
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  color: "#e23744",
                  fontSize: "14px",
                  margin: "8px 0",
                }}
              >
                {error}
              </p>
            )}

            <label className="remember">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span>I agree to Yumora&apos;s Terms &amp; Conditions</span>
            </label>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="register-text">
            Already have an account?
            <Link
              to="/login"
              style={{
                color: "#16a34a",
                fontWeight: "700",
                marginLeft: "5px",
                textDecoration: "none",
              }}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
