
import { useState } from "react";
import { useNavigate } from "react-router";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const identifier = email.trim();

    if (!identifier || !password) {
      setError("Please enter your email/mobile number and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/accounts/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Invalid email/mobile number or password."
        );
        return;
      }

      // Store customer information, not the password.
      localStorage.setItem(
        "yumoraUser",
        JSON.stringify(data.user)
      );

      localStorage.setItem("yumoraCustomerLoggedIn", "true");

      // Remove any old demo customer session flag.
      localStorage.removeItem("yumoraLoggedIn");

      navigate("/");
    } catch (err) {
      setError(
        "Unable to connect to Yumora. Please check that the server is running."
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
            Good food.
            <br />
            Good mood.
          </h1>

          <p>
            Login to discover delicious food and order from your favorite
            restaurants.
          </p>

          <div className="auth-food-icons">🍕 🍔 🍛 🍜</div>
        </div>

        <div className="auth-card">
          <h2>Welcome Back 👋</h2>

          <p className="auth-subtitle">
            Login to continue to Yumora
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="login-identifier">
              Email or Mobile Number
            </label>

            <input
              id="login-identifier"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Enter email or mobile number"
              autoComplete="username"
              required
            />

            <label htmlFor="login-password">Password</label>

            <div className="password-input">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
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

            <div className="login-options">
              <label className="remember">
                <input type="checkbox" />
                Remember me
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  setError("Password recovery is not available yet.")
                }
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-login">
            <button type="button">🔵 Google</button>
            <button type="button">📱 Phone</button>
          </div>

          <p className="register-text">
            Don't have an account?

            <button
              type="button"
              onClick={() => navigate("/register")}
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

