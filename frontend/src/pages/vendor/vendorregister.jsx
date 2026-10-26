import { useState } from "react";
import { Link, useNavigate } from "react-router";

const INITIAL = { username: "", business_name: "", email: "", phone: "", password: "", confirmPassword: "" };

function VendorRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
    setMessage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/vendor/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          business_name: form.business_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Vendor registration failed.");
        return;
      }
      setMessage(data.message || "Registration successful. Wait for admin approval.");
      setForm(INITIAL);
      setTimeout(() => navigate("/vendor/login"), 1200);
    } catch (err) {
      console.error(err);
      setError("Cannot connect to Django. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-brand">Yumora Partner</div>
          <h1>Partner with<br />Yumora.</h1>
          <p>Register your restaurant and start building your business with Yumora.</p>
          <div className="auth-food-icons">🍕 🍔 🍛 🍜</div>
        </div>
        <div className="auth-card">
          <h2>Vendor Registration</h2>
          <p className="auth-subtitle">Create your restaurant owner account</p>
          <form onSubmit={submit}>
            <label>Username *</label>
            <input name="username" value={form.username} onChange={change} placeholder="Choose a username" required autoComplete="username" />
            <label>Restaurant / Business Name *</label>
            <input name="business_name" value={form.business_name} onChange={change} placeholder="Your restaurant name" required />
            <label>Email Address *</label>
            <input type="email" name="email" value={form.email} onChange={change} placeholder="you@example.com" required autoComplete="email" />
            <label>Mobile Number *</label>
            <input type="tel" name="phone" value={form.phone} onChange={change} placeholder="Mobile number" required />
            <label>Password *</label>
            <input type="password" name="password" value={form.password} onChange={change} placeholder="At least 8 characters" required autoComplete="new-password" />
            <label>Confirm Password *</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={change} placeholder="Confirm password" required autoComplete="new-password" />
            {error && <p style={{ color: "#e23744", fontSize: 14, margin: "8px 0" }}>{error}</p>}
            {message && <p role="status" style={{ color: "#07834d", fontSize: 14, margin: "8px 0" }}>{message}</p>}
            <button className="login-submit" type="submit" disabled={loading}>{loading ? "Registering..." : "Create Vendor Account"}</button>
          </form>
          <p className="register-text">Already registered?
            <Link to="/vendor/login" style={{ marginLeft: 6, color: "#16a34a", fontWeight: 700 }}>Vendor login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
export default VendorRegister;
