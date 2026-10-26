import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useCart } from "../context/cartcontext";

function RestaurantDetails() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    replaceCart,
  } = useCart();

  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [showRestaurantPopup, setShowRestaurantPopup] =
    useState(false);

  const [pendingItem, setPendingItem] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

const showToast = (message) => {
  setToastMessage(message);

  setTimeout(() => {
    setToastMessage("");
  }, 2500);
};

  // Fetch real food items from Django
  useEffect(() => {
    const fetchFoodItems = async () => {
      setLoading(true);
      setApiError("");

      try {
        const response = await fetch("/api/food/");

        if (!response.ok) {
          throw new Error("Unable to load restaurant menu.");
        }

        const data = await response.json();

        const allItems = data.food_items || [];

        const restaurantItems = allItems.filter(
          (item) =>
            String(item.restaurant_id) === String(restaurantId)
        );

        setFoodItems(restaurantItems);
      } catch (error) {
        console.error("Error loading restaurant menu:", error);
        setApiError(
          "Unable to load the menu. Please check your server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFoodItems();
  }, [restaurantId]);

  // Build restaurant information from the Django response
  const restaurant =
    foodItems.length > 0
      ? {
          id: foodItems[0].restaurant_id,
          name: foodItems[0].restaurant_name,
          location: foodItems[0].restaurant_city || "Location unavailable",
          image: foodItems[0].image || "/images/biryani.jpg",
          description: `Explore delicious food from ${foodItems[0].restaurant_name}.`,
          cuisine: [
            ...new Set(
              foodItems.map((item) => item.category).filter(Boolean)
            ),
          ].join(" • ") || "Various dishes",
          deliveryTime: `${foodItems[0].preparation_time || 30} min preparation`,
        }
      : null;

  // Check whether the customer is logged in
  const isCustomerLoggedIn = () => {
    return (
      localStorage.getItem("yumoraLoggedIn") === "true" ||
      localStorage.getItem("yumoraCustomerLoggedIn") === "true"
    );
  };

  const requireCustomerLogin = () => {
    if (!isCustomerLoggedIn()) {
      alert("Please login or register before ordering food.");
      navigate("/login");
      return false;
    }

    return true;
  };

  // Find the quantity of an item already in the cart
  const getQuantity = (itemId) => {
    const cartItem = cartItems.find(
      (item) => String(item.id) === String(itemId)
    );

    return cartItem ? cartItem.quantity : 0;
  };

  // Add an item to the cart
  const handleAddToCart = (item) => {
    if (!requireCustomerLogin()) {
      return;
    }

    if (!restaurant) {
      return;
    }

    const itemToAdd = {
      ...item,
      id: item.id,
      name: item.name,
      price: Number(item.price),
      image: item.image || "/images/biryani.jpg",
      restaurantId: String(restaurantId),
      restaurantName: restaurant.name,
    };

    if (cartItems.length === 0) {
  addToCart(itemToAdd);
  showToast(`${item.name} added to cart`);
  return;
}

    const currentRestaurantId = String(cartItems[0].restaurantId);

   if (currentRestaurantId === String(restaurantId)) {
  addToCart(itemToAdd);
  showToast(`${item.name} added to cart`);
  return;
}

    setPendingItem(itemToAdd);
    setShowRestaurantPopup(true);
  };

  const handleIncreaseQuantity = (itemId) => {
    if (!requireCustomerLogin()) {
      return;
    }

    increaseQuantity(itemId);
  };

  const handleDecreaseQuantity = (itemId) => {
    if (!requireCustomerLogin()) {
      return;
    }

    decreaseQuantity(itemId);
  };

  const handleCancelSwitch = () => {
    setShowRestaurantPopup(false);
    setPendingItem(null);
  };

  // Clear the old cart and add food from this restaurant
  const handleClearAndAdd = () => {
    if (!requireCustomerLogin() || !pendingItem) {
      setShowRestaurantPopup(false);
      setPendingItem(null);
      return;
    }

    replaceCart(pendingItem);
    showToast(`${pendingItem.name} added to cart`);

    setShowRestaurantPopup(false);
    setPendingItem(null);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <h2>Loading restaurant menu...</h2>
        <p>Please wait.</p>
      </div>
    );
  }

  // API error state
  if (apiError) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <h2>Unable to load restaurant</h2>
        <p>{apiError}</p>

        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  // Invalid restaurant ID or no available food
  if (!restaurant) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <h1>Restaurant not found</h1>
        <p>No available food items were found for this restaurant.</p>

        <button onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="restaurant-details-page">
      {toastMessage && (
  <div
    style={{
      position: "fixed",
      top: "100px",
      right: "25px",
      background: "#16a34a",
      color: "#ffffff",
      padding: "16px 24px",
      borderRadius: "10px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
      zIndex: 9999,
      fontWeight: "600",
    }}
  >
    ✓ {toastMessage}
  </div>
)}
      {/* Restaurant header */}
      <section className="restaurant-header">
        <div className="restaurant-header-image">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            onError={(e) => {
              e.currentTarget.src = "/images/biryani.jpg";
            }}
          />
        </div>

        <div className="restaurant-header-content">
          <span className="restaurant-label">
            YUMORA RESTAURANT
          </span>

          <h1>{restaurant.name}</h1>

          <p className="restaurant-description">
            {restaurant.description}
          </p>

          <div className="restaurant-details-meta">
            <span>🍴 {restaurant.cuisine}</span>
            <span>🕒 {restaurant.deliveryTime}</span>
          </div>

          <p className="restaurant-location">
            📍 {restaurant.location}
          </p>
        </div>
      </section>

      {/* Restaurant food menu */}
      <section className="menu-section">
        <div className="section-heading">
          <h2>Available Food Items</h2>
          <p>
            Explore the menu from {restaurant.name}.
          </p>
        </div>

        <div className="menu-grid">
          {foodItems.map((item) => {
            const quantity = getQuantity(item.id);

            return (
              <div className="menu-card" key={item.id}>
                <img
                  src={item.image || "/images/biryani.jpg"}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.src = "/images/biryani.jpg";
                  }}
                />

                <div className="menu-card-content">
                  <h3>{item.name}</h3>

                  <p>
                    {item.description || "Freshly prepared food"}
                  </p>

                  <div className="menu-bottom">
                    <strong>
                      ₹{Number(item.price).toFixed(2)}
                    </strong>

                    {Number(item.quantity) <= 0 ? (
                      <button type="button" disabled>
                        Out of Stock
                      </button>
                    ) : quantity === 0 ? (
                      <button
                        type="button"
                        className="add-button"
                        onClick={() => handleAddToCart(item)}
                      >
                        ADD +
                      </button>
                    ) : (
                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() =>
                            handleDecreaseQuantity(item.id)
                          }
                        >
                          −
                        </button>

                        <span>{quantity}</span>

                        <button
  type="button"
  onClick={() => handleIncreaseQuantity(item.id)}
>
  +
</button>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    Available: {item.quantity}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Switch restaurant confirmation */}
      {showRestaurantPopup && (
        <div className="restaurant-popup-overlay">
          <div className="restaurant-popup">
            <div className="restaurant-popup-icon">
              🛒
            </div>

            <h2>
              Your cart contains items from another restaurant
            </h2>

            <p>
              Your cart currently contains items from{" "}
              <strong>
                {cartItems[0]?.restaurantName}
              </strong>.
            </p>

            <p>
              Do you want to clear your current cart and add items
              from <strong>{restaurant.name}</strong>?
            </p>

            <div className="restaurant-popup-actions">
              <button
                type="button"
                className="popup-cancel-button"
                onClick={handleCancelSwitch}
              >
                Cancel
              </button>

              <button
                type="button"
                className="popup-confirm-button"
                onClick={handleClearAndAdd}
              >
                Clear & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantDetails;