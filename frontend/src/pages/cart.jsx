import { Link, useNavigate } from "react-router";
import { useCart } from "../context/cartcontext";

function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    cartTotal,
  } = useCart();

  const deliveryFee = cartItems.length > 0 ? 40 : 0;
  const taxes = Math.round(cartTotal * 0.05);
  const grandTotal = cartTotal + deliveryFee + taxes;

  // Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="empty-cart-page">
        <div className="empty-cart-icon">🛒</div>

        <h1>Your cart is empty</h1>

        <p>
          Add delicious food from your favorite restaurants
          and it will appear here.
        </p>

        <Link to="/restaurants" className="browse-food-button">
          Explore Food
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">

      <div className="cart-container">

        {/* HEADING */}

        <div className="cart-heading">
          <h1>Your Cart 🛒</h1>
          <p>
            {cartItems.length}{" "}
            {cartItems.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>


        <div className="cart-layout">

          {/* CART ITEMS */}

          <div className="cart-items">

            {cartItems.map((item) => (

              <div className="cart-item" key={item.id}>

               <img
  src={item.image || "/images/biryani.jpg"}
  alt={item.name || "Food item"}
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/images/biryani.jpg";
  }}
/>

                <div className="cart-item-info">

                  <h3>{item.name}</h3>

                  <p>
                    ₹{item.price} × {item.quantity}
                  </p>

                  <strong>
                    ₹{item.price * item.quantity}
                  </strong>

                </div>


                {/* RIGHT SIDE */}

                <div className="cart-item-right">

                  <button
                    className="remove-item"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>

                  <div className="cart-quantity">

                    <button
                      onClick={() =>
                        decreaseQuantity(item.id)
                      }
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        increaseQuantity(item.id)
                      }
                    >
                      +
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>


          {/* BILL DETAILS */}

          <div className="bill-card">

            <h2>Bill Details</h2>

            <div className="bill-row">
              <span>Item Total</span>
              <span>₹{cartTotal}</span>
            </div>

            <div className="bill-row">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee}</span>
            </div>

            <div className="bill-row">
              <span>Taxes & Charges</span>
              <span>₹{taxes}</span>
            </div>

            <div className="bill-divider"></div>

            <div className="bill-total">
              <span>To Pay</span>
              <strong>₹{grandTotal}</strong>
            </div>

             <button
  className="checkout-button"
  onClick={() => navigate("/checkout")}
>
  Proceed to Checkout
</button>
           

          </div>

        </div>

      </div>

    </div>
  );
}

export default Cart;