import { Link } from "react-router";

function Footer() {
  return (
    <footer className="yumora-footer">

      <div className="footer-container">

        {/* BRAND */}

        <div className="footer-brand">

          <Link to="/" className="footer-logo">
            Yumora
          </Link>

          <p>
            Delicious food delivered to your doorstep.
            Discover the best restaurants and enjoy
            your favorite meals with Yumora.
          </p>

          <div className="footer-social">

            <a href="#" aria-label="Instagram">
              📷
            </a>

            <a href="#" aria-label="Facebook">
              f
            </a>

            <a href="#" aria-label="Twitter">
              𝕏
            </a>

            <a href="#" aria-label="YouTube">
              ▶
            </a>

          </div>

        </div>


        {/* COMPANY */}

        <div className="footer-column">

          <h3>Company</h3>

          <Link to="/">Home</Link>

          <Link to="/restaurants">
            Restaurants
          </Link>

          <Link to="/offers">
            Offers
          </Link>

          <Link to="/orders">
            My Orders
          </Link>

        </div>


        {/* FOR CUSTOMERS */}

        <div className="footer-column">

          <h3>For Customers</h3>

          <Link to="/login">
            Login
          </Link>

          <Link to="/register">
            Create Account
          </Link>

          <Link to="/cart">
            Cart
          </Link>

          <a href="#">
            Help & Support
          </a>

        </div>


        {/* FOR RESTAURANTS */}

        <div className="footer-column">

          <h3>For Restaurants</h3>

          <a href="#">
            Partner With Us
          </a>

          <a href="#">
            Restaurant Login
          </a>

          <a href="#">
            Business Dashboard
          </a>

          <a href="#">
            Restaurant Resources
          </a>

        </div>


        {/* CONTACT */}

        <div className="footer-column">

          <h3>Contact Us</h3>

          <a href="mailto:support@yumora.com">
            📧 support@yumora.com
          </a>

          <a href="tel:+919876543210">
            📞 +91 98765 43210
          </a>

          <p>
            📍 Hanamkonda, Telangana
          </p>

        </div>

      </div>


      {/* FOOTER BOTTOM */}

      <div className="footer-bottom">

        <p>
          © 2026 Yumora. All rights reserved.
        </p>

        <div className="footer-bottom-links">

          <a href="#">
            Privacy Policy
          </a>

          <a href="#">
            Terms & Conditions
          </a>

          <a href="#">
            Cookie Policy
          </a>

        </div>

      </div>

    </footer>
  );
}

export default Footer;