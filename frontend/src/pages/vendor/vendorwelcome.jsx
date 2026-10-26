import { Link } from "react-router";

function VendorWelcome() {
  return (
    <div
      style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5fbf7",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "45px 30px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#16a34a", fontSize: "38px" }}>
          Welcome to Yumora Partners
        </h1>

        <p
          style={{
            color: "#64748b",
            fontSize: "17px",
            marginBottom: "35px",
          }}
        >
          Manage your restaurant, add food items, and grow your
          business with Yumora.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
          }}
        >
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "30px 20px",
            }}
          >
            <h2>Already a Vendor?</h2>

            <p style={{ color: "#64748b" }}>
              Sign in to access your restaurant dashboard.
            </p>

            <Link
              to="/vendor/login"
              style={buttonStyle}
            >
              Vendor Login
            </Link>
          </div>

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "30px 20px",
            }}
          >
            <h2>New Vendor?</h2>

            <p style={{ color: "#64748b" }}>
              Register your account and submit your restaurant
              details for approval.
            </p>

            <Link
              to="/vendor/register"
              style={buttonStyle}
            >
              Register as Vendor
            </Link>
          </div>
        </div>

        <p style={{ marginTop: "30px" }}>
          <Link to="/" style={{ color: "#16a34a" }}>
            Back to Yumora Home
          </Link>
        </p>
      </div>
    </div>
  );
}

const buttonStyle = {
  display: "inline-block",
  background: "#16a34a",
  color: "#ffffff",
  padding: "13px 24px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: 700,
  marginTop: "12px",
};

export default VendorWelcome;