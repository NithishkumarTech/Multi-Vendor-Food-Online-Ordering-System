import { useNavigate } from "react-router";

function Orders() {
  const navigate = useNavigate();

  const savedOrder = localStorage.getItem("yumoraLatestOrder");
  const order = savedOrder ? JSON.parse(savedOrder) : null;

  return (
    <div className="orders-page">
      <div className="orders-container">

        <div className="orders-header">
          <h1>My Orders</h1>
          <p>
            Track your orders and reorder your
            favorite food.
          </p>
        </div>

        {order ? (
          <>
            {/* SUCCESS MESSAGE */}
            <div className="order-success">
              <div className="success-icon">🎉</div>

              <h2>Order Successful!</h2>

              <p>
                Your order has been placed successfully.
              </p>

              <div className="order-success-details">
                <p>
                  <strong>Order ID:</strong> {order.id}
                </p>

                <p>
                  <strong>Payment:</strong>{" "}
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : order.paymentMethod.toUpperCase()}
                </p>

                <p>
                  <strong>Total:</strong> ₹{order.total}
                </p>
              </div>

              <button
                className="start-ordering-button"
                onClick={() => navigate("/")}
              >
                Continue Ordering
              </button>
            </div>

            {/* ORDER DETAILS */}
            <div className="order-card">

              <div className="order-card-header">
                <div>
                  <h2>{order.restaurantName}</h2>
                  <p>Order #{order.id}</p>
                </div>

                <span className="order-status">
                  {order.status}
                </span>
              </div>

              <div className="order-items-list">
                {order.items.map((item) => (
                  <div
                    className="order-item"
                    key={item.id}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                    />

                    <div className="order-item-info">
                      <h3>{item.name}</h3>

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

              <div className="order-total">
                <span>Total Paid / To Pay</span>

                <strong>
                  ₹{order.total}
                </strong>
              </div>

            </div>
          </>
        ) : (
          /* NO ORDERS */
          <div className="empty-orders">

            <div className="orders-icon">
              📦
            </div>

            <h2>No orders yet</h2>

            <p>
              Your delicious orders will appear here.
            </p>

            <button
              onClick={() => navigate("/")}
            >
              Start Ordering
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

export default Orders;