import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCart } from "../context/cartcontext";

function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    cartTotal,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState("upi");

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    house: "",
    street: "",
    city: "",
    pincode: "",
  });

  const [error, setError] = useState("");

  const deliveryFee = cartItems.length > 0 ? 40 : 0;
  const taxes = Math.round(cartTotal * 0.05);
  const grandTotal = cartTotal + deliveryFee + taxes;

  const handleChange = (e) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!address.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!address.phone.trim()) {
      setError("Please enter your mobile number.");
      return;
    }
    if (!address.house.trim()) {
      setError("Please enter your house / flat number.");
      return;
    }
    if (!address.street.trim()) {
      setError("Please enter your street or area.");
      return;
    }
    if (!address.city.trim()) {
      setError("Please enter your city.");
      return;
    }
    if (!address.pincode.trim()) {
      setError("Please enter your pincode.");
      return;
    }
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setError("");
    setIsPlacingOrder(true);

    try {
      const response = await fetch("/api/orders/place/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          address: {
            name: address.name.trim(),
            phone: address.phone.trim(),
            house_no: address.house.trim(),
            street: address.street.trim(),
            city: address.city.trim(),
            state: "Telangana",
            pincode: address.pincode.trim(),
          },
          payment_method:
            paymentMethod === "netbanking" ? "net_banking" : paymentMethod,
          items: cartItems.map((item) => ({
            food_item_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.order) {
        throw new Error(
          data.message || data.error || "Unable to place your order."
        );
      }

      const savedOrder = {
        id: data.order.order_number || data.order.id,
        restaurantName: data.order.restaurant,
        items: (data.items || []).map((item) => {
          const cartItem = cartItems.find(
            (cart) =>
              String(cart.id) === String(item.food_item_id) ||
              cart.name === item.food_name
          );
          return {
            ...cartItem,
            id: item.food_item_id || cartItem?.id,
            name: item.food_name,
            price: Number(item.unit_price),
            quantity: Number(item.quantity),
            total: Number(item.subtotal),
          };
        }),
        address,
        paymentMethod,
        itemTotal: Number(data.order.subtotal),
        deliveryFee: Number(data.order.delivery_fee),
        taxes: Number(data.order.tax),
        total: Number(data.order.total_amount),
        status: data.order.order_status,
        createdAt: data.order.created_at,
      };

      localStorage.setItem("yumoraLatestOrder", JSON.stringify(savedOrder));
      clearCart();
      navigate("/orders");
    } catch (err) {
      setError(err.message || "Could not place your order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart-page">
        <div className="empty-cart-icon">🛒</div>

        <h1>Your cart is empty</h1>

        <p>
          Add some delicious food before proceeding
          to checkout.
        </p>

        <Link
          to="/restaurants"
          className="browse-food-button"
        >
          Explore Food
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">

      <div className="checkout-container">

        {/* HEADER */}

        <div className="checkout-heading">

          <h1>
            Checkout
          </h1>

          <p>
            Complete your order and payment
          </p>

        </div>


        <div className="checkout-layout">

          {/* LEFT SIDE */}

          <div className="checkout-left">

            {/* DELIVERY ADDRESS */}

            <div className="checkout-card">

              <h2>
                📍 Delivery Address
              </h2>

              <div className="checkout-form">

                <div className="checkout-row">

                  <div className="checkout-field">

                    <label>
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={address.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                    />

                  </div>


                  <div className="checkout-field">

                    <label>
                      Mobile Number
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={address.phone}
                      onChange={handleChange}
                      placeholder="Enter mobile number"
                    />

                  </div>

                </div>


                <div className="checkout-field">

                  <label>
                    House / Flat Number
                  </label>

                  <input
                    type="text"
                    name="house"
                    value={address.house}
                    onChange={handleChange}
                    placeholder="House / Flat / Building"
                  />

                </div>


                <div className="checkout-field">

                  <label>
                    Street / Area
                  </label>

                  <input
                    type="text"
                    name="street"
                    value={address.street}
                    onChange={handleChange}
                    placeholder="Street / Area / Landmark"
                  />

                </div>


                <div className="checkout-row">

                  <div className="checkout-field">

                    <label>
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={address.city}
                      onChange={handleChange}
                      placeholder="City"
                    />

                  </div>


                  <div className="checkout-field">

                    <label>
                      Pincode
                    </label>

                    <input
                      type="text"
                      name="pincode"
                      value={address.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                    />

                  </div>

                </div>

              </div>

            </div>


            {/* ORDER ITEMS */}

            <div className="checkout-card">

              <h2>
                🛍️ Your Order
              </h2>

              <p className="checkout-restaurant">
                🍴 {cartItems[0]?.restaurantName}
              </p>


              <div className="checkout-items">

                {cartItems.map((item) => (

                  <div
                    className="checkout-item"
                    key={item.id}
                  >

                    <img
                      src={item.image}
                      alt={item.name}
                    />

                    <div className="checkout-item-info">

                      <h3>
                        {item.name}
                      </h3>

                      <p>
                        ₹{item.price} × {item.quantity}
                      </p>

                    </div>

                    <strong>
                      ₹{item.price * item.quantity}
                    </strong>

                  </div>

                ))}

              </div>

            </div>


            {/* PAYMENT */}

            <div className="checkout-card">

              <h2>
                💳 Payment Method
              </h2>


              <div className="payment-options">

                {/* UPI */}

                <label
                  className={`payment-option ${
                    paymentMethod === "upi"
                      ? "selected-payment"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === "upi"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value)
                    }
                  />

                  <span className="payment-icon">
                    📱
                  </span>

                  <span>
                    <strong>UPI</strong>
                    <small>
                      Google Pay, PhonePe, Paytm
                    </small>
                  </span>

                </label>


                {/* CARD */}

                <label
                  className={`payment-option ${
                    paymentMethod === "card"
                      ? "selected-payment"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value)
                    }
                  />

                  <span className="payment-icon">
                    💳
                  </span>

                  <span>
                    <strong>Credit / Debit Card</strong>
                    <small>
                      Visa, Mastercard, RuPay
                    </small>
                  </span>

                </label>


                {/* NET BANKING */}

                <label
                  className={`payment-option ${
                    paymentMethod === "netbanking"
                      ? "selected-payment"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    name="payment"
                    value="netbanking"
                    checked={paymentMethod === "netbanking"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value)
                    }
                  />

                  <span className="payment-icon">
                    🏦
                  </span>

                  <span>
                    <strong>Net Banking</strong>
                    <small>
                      All major banks
                    </small>
                  </span>

                </label>


                {/* COD */}

                <label
                  className={`payment-option ${
                    paymentMethod === "cod"
                      ? "selected-payment"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value)
                    }
                  />

                  <span className="payment-icon">
                    💵
                  </span>

                  <span>
                    <strong>
                      Cash on Delivery
                    </strong>

                    <small>
                      Pay when your order arrives
                    </small>
                  </span>

                </label>

              </div>

            </div>

          </div>


          {/* RIGHT SIDE BILL */}

          <div className="checkout-right">

            <div className="checkout-bill">

              <h2>
                Bill Details
              </h2>


              <div className="checkout-bill-row">

                <span>
                  Item Total
                </span>

                <span>
                  ₹{cartTotal}
                </span>

              </div>


              <div className="checkout-bill-row">

                <span>
                  Delivery Fee
                </span>

                <span>
                  ₹{deliveryFee}
                </span>

              </div>


              <div className="checkout-bill-row">

                <span>
                  Taxes & Charges
                </span>

                <span>
                  ₹{taxes}
                </span>

              </div>


              <div className="checkout-bill-divider"></div>


              <div className="checkout-grand-total">

                <span>
                  To Pay
                </span>

                <strong>
                  ₹{grandTotal}
                </strong>

              </div>


              {error && (

                <p className="checkout-error">
                  {error}
                </p>

              )}


              <button
                type="button"
                className="place-order-button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder
                  ? "Placing Order..."
                  : paymentMethod === "cod"
                    ? "Place Order"
                    : `Pay ₹${grandTotal}`}
              </button>


              <p className="secure-payment">
                🔒 Your payment information is secure
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Checkout;