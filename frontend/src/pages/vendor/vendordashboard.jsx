import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import "./vendordashboard.css";
import AddFoodItem from "./addfooditem";

const EMPTY_RESTAURANT = {
  name: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  opening_time: "09:00",
  closing_time: "22:00",
};

function VendorDashboard() {
  const navigate = useNavigate();
  const [vendorInfo, setVendorInfo] = useState(null);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [showAddFoodForm, setShowAddFoodForm] = useState(false);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [foodItemsLoading, setFoodItemsLoading] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [editFoodForm, setEditFoodForm] = useState({
    name: "",
    description: "",
    price: "",
    quantity: 0,
    preparation_time: 20,
    is_vegetarian: false,
    is_available: true,
  });
  const [foodActionLoading, setFoodActionLoading] = useState(false);
  const [restaurant, setRestaurant] = useState(EMPTY_RESTAURANT);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [businessSubmitted, setBusinessSubmitted] = useState(false);

  const menuItems = [
    "Dashboard",
    "My Restaurant",
    "Food Items",
    "Orders",
    "Earnings",
    "Profile",
  ];

  // Read JSON safely and show useful errors if Django returns HTML.
  const readResponse = async (response) => {
    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      const preview = text
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180);

      throw new Error(
        `Django returned HTML instead of JSON (HTTP ${response.status}). ${
          preview || "Check the Django terminal and API URL."
        }`
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `Request failed with status ${response.status}`
      );
    }

    return data;
  };

  // Load restaurants from Django.
  const loadRestaurants = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/vendor/restaurants/", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await readResponse(response);

      setRestaurants(
        Array.isArray(data) ? data : data.restaurants || []
      );
    } catch (error) {
      console.error("Load restaurants error:", error);
      setMessage(error.message || "Unable to load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  const startEditingFood = (food) => {
    setEditingFoodId(food.id);
    setEditFoodForm({
      name: food.name || "",
      description: food.description || "",
      price: food.price ?? "",
      quantity: Number(food.quantity ?? 0),
      preparation_time: Number(food.preparation_time ?? 20),
      is_vegetarian: Boolean(food.is_vegetarian),
      is_available: Boolean(food.is_available),
    });
    setMessage("");
  };

  const handleEditFoodChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditFoodForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveFoodChanges = async (event) => {
    event.preventDefault();
    if (!editingFoodId) return;

    setFoodActionLoading(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/vendor/food/${editingFoodId}/update/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            ...editFoodForm,
            price: Number(editFoodForm.price),
            quantity: Number(editFoodForm.quantity),
            preparation_time: Number(editFoodForm.preparation_time),
          }),
        }
      );
      const data = await readResponse(response);
      setEditingFoodId(null);
      await loadFoodItems();
      setMessage(data.message || "Food item updated successfully.");
    } catch (error) {
      console.error("Update food item error:", error);
      setMessage(error.message || "Unable to update food item.");
    } finally {
      setFoodActionLoading(false);
    }
  };

  const changeFoodAvailability = async (food) => {
    const nextAvailability = !food.is_available;
    if (nextAvailability && Number(food.quantity) <= 0) {
      setMessage("Add available stock before marking this item available.");
      return;
    }

    setFoodActionLoading(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/vendor/food/${food.id}/availability/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ is_available: nextAvailability }),
        }
      );
      const data = await readResponse(response);
      setFoodItems((previous) =>
        previous.map((item) =>
          item.id === food.id
            ? { ...item, is_available: nextAvailability }
            : item
        )
      );
      setMessage(data.message || "Food availability updated.");
    } catch (error) {
      console.error("Food availability error:", error);
      setMessage(error.message || "Unable to update food availability.");
    } finally {
      setFoodActionLoading(false);
    }
  };

  const deleteFoodItem = async (food) => {
    const confirmed = window.confirm(
      `Permanently delete "${food.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setFoodActionLoading(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/vendor/food/${food.id}/delete/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );
      const data = await readResponse(response);
      setFoodItems((previous) =>
        previous.filter((item) => item.id !== food.id)
      );
      if (editingFoodId === food.id) setEditingFoodId(null);
      setMessage(data.message || "Food item deleted successfully.");
    } catch (error) {
      console.error("Delete food item error:", error);
      setMessage(error.message || "Unable to delete food item.");
    } finally {
      setFoodActionLoading(false);
    }
  };

  // Load food items belonging to the logged-in vendor.
  const loadFoodItems = async () => {
    if (!vendorInfo?.is_approved) {
      setFoodItems([]);
      return;
    }

    setFoodItemsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/vendor/food/", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = await readResponse(response);
      setFoodItems(Array.isArray(data.food_items) ? data.food_items : []);
    } catch (error) {
      console.error("Load food items error:", error);
      setMessage(error.message || "Unable to load food items.");
    } finally {
      setFoodItemsLoading(false);
    }
  };

useEffect(() => {
    let cancelled = false;

    const checkVendorLogin = async () => {
      try {
        const response = await fetch("/api/vendor/status/", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (cancelled) return;

        if (response.status === 401 || response.status === 403) {
          navigate("/vendor/login", { replace: true });
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.authenticated) {
          navigate("/vendor/login", { replace: true });
          return;
        }

        if (cancelled) return;
        setVendorInfo(data);

        // Pending vendors can submit their first business details.
        const restaurantsResponse = await fetch("/api/vendor/restaurants/", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const restaurantsData = await readResponse(restaurantsResponse);
        const savedRestaurants = Array.isArray(restaurantsData)
          ? restaurantsData
          : restaurantsData.restaurants || [];

        if (cancelled) return;
        setRestaurants(savedRestaurants);

        if (!data.is_approved) {
          if (savedRestaurants.length > 0) {
            setBusinessSubmitted(true);
            setShowRestaurantForm(false);
            setActiveMenu("Dashboard");
           
          } else {
            setBusinessSubmitted(false);
            setShowRestaurantForm(true);
            setActiveMenu("My Restaurant");
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Vendor verification error:", error);
          setMessage(
            "Unable to connect to the server. Please check that Django is running."
          );
        }
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    };

    checkVendorLogin();

    return () => {
      cancelled = true;
    };
  }, [navigate]);
 

  const handleChange = (event) => {
    const { name, value } = event.target;

    setRestaurant((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openRestaurantForm = () => {
    if (!vendorInfo?.is_approved && businessSubmitted) {
      setMessage(
        "Your business details have already been submitted. Please wait for admin approval."
      );
      return;
    }

    setMessage("");
    setRestaurant(EMPTY_RESTAURANT);
    setShowRestaurantForm(true);
  };

  const closeRestaurantForm = () => {
    setShowRestaurantForm(false);
    setMessage("");
  };

  // Save restaurant through Django.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(
        "/api/vendor/restaurants/add/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(restaurant),
        }
      );

      const data = await readResponse(response);

      const pendingApproval = !vendorInfo?.is_approved;

      setRestaurant(EMPTY_RESTAURANT);
      setShowRestaurantForm(false);
      setActiveMenu("Dashboard");

      if (pendingApproval) {
        setBusinessSubmitted(true);
        setMessage(
          data.message ||
            "Your business details have been submitted successfully. Please wait for admin approval."
        );
        window.alert(
          "Business details submitted successfully!\n\nYour account is waiting for admin approval. The administrator will review your restaurant details before approving your account."
        );
        if (data.restaurant) {
          setRestaurants([data.restaurant]);
        } else {
          await loadRestaurants();
        }
      } else {
        setMessage(data.message || "Restaurant added successfully!");
        await loadRestaurants();
      }
    } catch (error) {
      console.error("Restaurant save error:", error);
      setMessage(error.message || "Unable to save restaurant.");
    } finally {
      setSaving(false);
    }
  };

  const renderRestaurantList = () => {
    if (loading) {
      return <div className="orders-empty"><p>Loading restaurants...</p></div>;
    }

    if (restaurants.length === 0) {
      return (
        <div className="restaurant-empty">
          <div className="restaurant-icon">🍽️</div>
          <h2>No Restaurant Added</h2>
          <p>
            Add your restaurant to start selling food on Yumora.
          </p>
          <button
            type="button"
            className="vendor-primary-btn"
            onClick={openRestaurantForm}
            disabled={vendorInfo && !vendorInfo.is_approved && businessSubmitted}
            title={vendorInfo && !vendorInfo.is_approved && businessSubmitted ? "Business details submitted; waiting for admin approval" : ""}
          >
            + Add Restaurant
          </button>
        </div>
      );
    }

    return (
      <div className="vendor-restaurant-list">
        {restaurants.map((item) => (
          <article className="vendor-section" key={item.id}>
            <h2>{item.name}</h2>
            <p>
              📍 {item.address}, {item.city}, {item.state}
            </p>
            <p>📞 {item.phone}</p>
            {item.email && <p>✉️ {item.email}</p>}
            {item.description && <p>{item.description}</p>}
            <p>
              🕒 {item.opening_time} – {item.closing_time}
              <button
  type="button"
  onClick={() => {
    setSelectedRestaurant(item);
    setActiveMenu("Food Items");
    setShowAddFoodForm(false);
    setMessage("");
    loadFoodItems();
  }}
>
  Manage Food Items
</button>
            </p>
          </article>
        ))}
      </div>
    );
  };

  if (authChecking) {
    return (
      <div className="vendor-dashboard">
        <main className="vendor-main">
          <section className="vendor-section" role="status" aria-live="polite">
            <h2>Checking vendor account...</h2>
            <p>Please wait while we verify your login and approval status.</p>
          </section>
        </main>
      </div>
    );
  }


  // A pending vendor sees only the application-status page, not the full dashboard.
  if (businessSubmitted && vendorInfo && !vendorInfo.is_approved && !showRestaurantForm) {
    const submittedRestaurant = restaurants[0];

    return (
      <div className="vendor-pending-page">
        <main className="vendor-pending-content">
          <section className="vendor-pending-business">
            <h1>{submittedRestaurant?.name || vendorInfo.business_name || "Your Restaurant"}</h1>
            <p className="vendor-pending-label">BUSINESS ADDRESS</p>
            <p>
              {[submittedRestaurant?.address, submittedRestaurant?.city, submittedRestaurant?.state, submittedRestaurant?.pincode]
                .filter(Boolean)
                .join(", ") || "Your business details have been submitted."}
            </p>
            {submittedRestaurant?.phone && <p>Phone: {submittedRestaurant.phone}</p>}
          </section>

          <section className="vendor-pending-status" role="status" aria-live="polite">
            <div className="vendor-pending-status-icon">⌛</div>
            <div>
              <p className="vendor-pending-label">APPLICATION STATUS</p>
              <h2>Waiting for Approval</h2>
              <p>Your business details have been submitted successfully. The admin is reviewing your application.</p>
            </div>
          </section>

          <section className="vendor-pending-products">
            <div>
              <p className="vendor-pending-label">SELLING</p>
              <h2>Food Item Management</h2>
              <p>Food item management will be available after your vendor account is approved.</p>
            </div>
            <button type="button" disabled title="Available after admin approval">
              🔒 Add Food Item
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`vendor-dashboard ${
        showRestaurantForm && restaurants.length === 0 && !businessSubmitted
          ? "onboarding-only"
          : ""
      }`}
    >
      <aside className="vendor-sidebar">
        <div className="vendor-logo">
          <h2>Yumora</h2>
          <span>Vendor Panel</span>
        </div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              type="button"
              className={
                activeMenu === item
                  ? "vendor-menu active"
                  : "vendor-menu"
              }
              onClick={() => {
                setActiveMenu(item);
                setShowRestaurantForm(false);
                setMessage("");

                if (item === "My Restaurant") {
                  loadRestaurants();
                }
                if (item === "Food Items" && vendorInfo?.is_approved) {
                  loadFoodItems();
                }
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="vendor-logout"
          onClick={async () => {
            try {
              await fetch("/api/vendor/logout/", {
                method: "POST",
                credentials: "include",
                headers: { Accept: "application/json" },
              });
            } catch (error) {
              console.error("Vendor logout error:", error);
            }
            localStorage.removeItem("yumoraVendor");
            navigate("/vendor/login", { replace: true });
          }}
        >
          Logout
        </button>
      </aside>

      <main className="vendor-main">
        <header className="vendor-header">
          <div>
            <h1>
              {showRestaurantForm
                ? "Add Restaurant"
                : activeMenu}
            </h1>
            <p>Welcome back, {vendorInfo?.business_name || "Vendor"}!</p>
          </div>

          <div className="vendor-profile">
            <div className="vendor-avatar">V</div>
            <div>
              <strong>{vendorInfo?.business_name || "Vendor"}</strong>
              <span>Restaurant Owner</span>
            </div>
          </div>
        </header>

        {message && (
          <div role="status" aria-live="polite">
            {message}
          </div>
        )}

        {activeMenu === "Dashboard" && businessSubmitted && vendorInfo && !vendorInfo.is_approved && (
          <section className="vendor-section" role="status" aria-live="polite">
            <h2>Waiting for Admin Approval</h2>
            <p>
              Your business details have been submitted. The administrator will
              review the information and approve your vendor account. Adding
              food items and managing the restaurant will be available after approval.
            </p>
          </section>
        )}

        {activeMenu === "Dashboard" && !showRestaurantForm && (
          <>
            <section className="vendor-stats">
              <div className="vendor-stat-card">
                <span>📦</span>
                <div>
                  <p>Total Orders</p>
                  <h2>0</h2>
                </div>
              </div>

              <div className="vendor-stat-card">
                <span>💰</span>
                <div>
                  <p>Total Earnings</p>
                  <h2>₹0</h2>
                </div>
              </div>

              <div className="vendor-stat-card">
                <span>🍔</span>
                <div>
                  <p>Food Items</p>
                  <h2>0</h2>
                </div>
              </div>

              <div className="vendor-stat-card">
                <span>⭐</span>
                <div>
                  <p>Rating</p>
                  <h2>0.0</h2>
                </div>
              </div>
            </section>

            <section className="vendor-section">
              <div className="section-title">
                <div>
                  <h2>My Restaurant</h2>
                  <p>Manage your restaurant information.</p>
                </div>
                <button
                  type="button"
                  className="vendor-primary-btn"
                  onClick={openRestaurantForm}
                  disabled={vendorInfo && !vendorInfo.is_approved && businessSubmitted}
                  title={vendorInfo && !vendorInfo.is_approved && businessSubmitted ? "Business details submitted; waiting for admin approval" : ""}
                >
                  + Add Restaurant
                </button>
              </div>

              {renderRestaurantList()}
            </section>

            <section className="vendor-section">
              <div className="section-title">
                <div>
                  <h2>Recent Orders</h2>
                  <p>Your latest customer orders.</p>
                </div>
                <button
                  type="button"
                  className="view-all-btn"
                  onClick={() => setActiveMenu("Orders")}
                >
                  View All
                </button>
              </div>

              <div className="orders-empty">
                <span>📋</span>
                <p>No orders yet</p>
              </div>
            </section>
          </>
        )}

        {activeMenu === "My Restaurant" && !showRestaurantForm && (
          <section className="vendor-section">
            <div className="section-title">
              <div>
                <h2>My Restaurant</h2>
                <p>Manage your restaurant information.</p>
              </div>
              <button
                type="button"
                className="vendor-primary-btn"
                onClick={openRestaurantForm}
                disabled={vendorInfo && !vendorInfo.is_approved && businessSubmitted}
                title={vendorInfo && !vendorInfo.is_approved && businessSubmitted ? "Business details submitted; waiting for admin approval" : ""}
              >
                + Add Restaurant
              </button>
            </div>

            {renderRestaurantList()}
          </section>
        )}

        {showRestaurantForm && (
          <section className="vendor-section">
            <div className="section-title">
              <div>
                <h2>Add Your Restaurant</h2>
                <p>Enter your restaurant details below.</p>
              </div>
              <button
                type="button"
                className="view-all-btn"
                onClick={closeRestaurantForm}
              >
                Cancel
              </button>
            </div>

            <form
              className="restaurant-form"
              onSubmit={handleSubmit}
            >
              <div className="restaurant-form-field">
                <label htmlFor="name">Restaurant Name *</label>
                <input
                  id="name"
                  name="name"
                  value={restaurant.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="restaurant-form-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={restaurant.description}
                  onChange={handleChange}
                />
              </div>

              <div className="restaurant-form-field">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={restaurant.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="restaurant-form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={restaurant.email}
                  onChange={handleChange}
                />
              </div>

              <div className="restaurant-form-field">
                <label htmlFor="address">Full Address *</label>
                <input
                  id="address"
                  name="address"
                  value={restaurant.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="restaurant-form-field">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  name="city"
                  value={restaurant.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="restaurant-form-field">
                <label htmlFor="state">State *</label>
                <input
                  id="state"
                  name="state"
                  value={restaurant.state}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="restaurant-form-field">
                <label htmlFor="pincode">PIN Code *</label>
                <input
                  id="pincode"
                  name="pincode"
                  inputMode="numeric"
                  value={restaurant.pincode}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="restaurant-form-field">
                <label htmlFor="opening_time">Opening Time *</label>
                <input
                  id="opening_time"
                  name="opening_time"
                  type="time"
                  value={restaurant.opening_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="restaurant-form-field">
                <label htmlFor="closing_time">Closing Time *</label>
                <input
                  id="closing_time"
                  name="closing_time"
                  type="time"
                  value={restaurant.closing_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="vendor-primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : vendorInfo && !vendorInfo.is_approved
                    ? "Submit Business Details"
                    : "Save Restaurant"}
              </button>
            </form>
          </section>
        )}
{activeMenu === "Food Items" && !showAddFoodForm && (
  <section className="vendor-section">
    {!vendorInfo?.is_approved ? (
      <div className="orders-empty">
        <h2>Food Management Locked</h2>
        <p>
          Your vendor account is waiting for admin approval. You can add and
          manage food items after your account has been approved.
        </p>
      </div>
    ) : (
      <>
        <div className="section-title">
          <div>
            <h2>My Food Items</h2>
            <p>
              Manage the food menu
              {selectedRestaurant?.name ? ` for ${selectedRestaurant.name}` : " for your restaurants"}.
            </p>
          </div>
          <button
            type="button"
            className="vendor-primary-btn"
            onClick={() => {
              setMessage("");
              setShowAddFoodForm(true);
            }}
          >
            + Add Food Item
          </button>
        </div>

        <button
          type="button"
          className="view-all-btn"
          onClick={loadFoodItems}
          disabled={foodItemsLoading || foodActionLoading}
          style={{ marginBottom: "16px" }}
        >
          {foodItemsLoading ? "Refreshing..." : "Refresh Food Items"}
        </button>

        {foodItemsLoading ? (
          <div className="orders-empty"><p>Loading your food items...</p></div>
        ) : foodItems.filter(
            (food) =>
              !selectedRestaurant ||
              Number(food.restaurant_id) === Number(selectedRestaurant.id)
          ).length === 0 ? (
          <div className="orders-empty">
            <span>🍽️</span>
            <p>You haven't added any food items to this restaurant yet.</p>
            <p>Click “Add Food Item” to add your first menu item.</p>
          </div>
        ) : (
          <div className="vendor-restaurant-list">
            {foodItems
              .filter(
                (food) =>
                  !selectedRestaurant ||
                  Number(food.restaurant_id) === Number(selectedRestaurant.id)
              )
              .map((food) => (
                <article className="vendor-section" key={food.id}>
                  <div style={{ display: "flex", gap: "18px", alignItems: "center", flexWrap: "wrap" }}>
                    {food.image && (
                      <img
                        src={food.image}
                        alt={food.name}
                        style={{ width: "120px", height: "100px", objectFit: "cover", borderRadius: "10px" }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: "220px" }}>
                      <h2>{food.name}</h2>
                      {food.description && <p>{food.description}</p>}
                      {food.restaurant_name && <p><strong>Restaurant:</strong> {food.restaurant_name}</p>}
                      <p><strong>Price:</strong> ₹{Number(food.price).toFixed(2)}</p>
                      <p><strong>Quantity:</strong> {food.quantity}</p>
                      {food.category && <p><strong>Category:</strong> {food.category}</p>}
                      <p>
                        <strong>Status:</strong>{" "}
                        {food.is_available && Number(food.quantity) > 0
                          ? "Available"
                          : "Out of Stock"}
                      </p>
                    </div>
                  </div>

                  {editingFoodId === food.id ? (
                    <form
                      onSubmit={saveFoodChanges}
                      style={{
                        display: "grid",
                        gap: "12px",
                        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                        marginTop: "18px",
                      }}
                    >
                      <label>
                        Food name *
                        <input
                          name="name"
                          value={editFoodForm.name}
                          onChange={handleEditFoodChange}
                          required
                        />
                      </label>
                      <label>
                        Price (₹) *
                        <input
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={editFoodForm.price}
                          onChange={handleEditFoodChange}
                          required
                        />
                      </label>
                      <label>
                        Quantity *
                        <input
                          name="quantity"
                          type="number"
                          min="0"
                          step="1"
                          value={editFoodForm.quantity}
                          onChange={handleEditFoodChange}
                          required
                        />
                      </label>
                      <label>
                        Preparation time (minutes)
                        <input
                          name="preparation_time"
                          type="number"
                          min="0"
                          step="1"
                          value={editFoodForm.preparation_time}
                          onChange={handleEditFoodChange}
                          required
                        />
                      </label>
                      <label style={{ gridColumn: "1 / -1" }}>
                        Description
                        <textarea
                          name="description"
                          rows="3"
                          value={editFoodForm.description}
                          onChange={handleEditFoodChange}
                        />
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          name="is_vegetarian"
                          type="checkbox"
                          checked={editFoodForm.is_vegetarian}
                          onChange={handleEditFoodChange}
                        />
                        Vegetarian
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          name="is_available"
                          type="checkbox"
                          checked={editFoodForm.is_available}
                          onChange={handleEditFoodChange}
                          disabled={Number(editFoodForm.quantity) <= 0}
                        />
                        Available to customers
                      </label>
                      <div style={{ display: "flex", gap: "10px", gridColumn: "1 / -1", flexWrap: "wrap" }}>
                        <button type="submit" className="vendor-primary-btn" disabled={foodActionLoading}>
                          {foodActionLoading ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          className="view-all-btn"
                          onClick={() => setEditingFoodId(null)}
                          disabled={foodActionLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
                      <button
                        type="button"
                        className="view-all-btn"
                        onClick={() => startEditingFood(food)}
                        disabled={foodActionLoading}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="view-all-btn"
                        onClick={() => changeFoodAvailability(food)}
                        disabled={foodActionLoading || (!food.is_available && Number(food.quantity) <= 0)}
                        title={!food.is_available && Number(food.quantity) <= 0 ? "Increase quantity before marking available" : ""}
                      >
                        {food.is_available && Number(food.quantity) > 0
                          ? "🔴 Mark Out of Stock"
                          : "🟢 Mark Available"}
                      </button>
                      <button
                        type="button"
                        className="view-all-btn"
                        onClick={() => deleteFoodItem(food)}
                        disabled={foodActionLoading}
                        style={{ borderColor: "#dc2626", color: "#dc2626" }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
          </div>
        )}
      </>
    )}
  </section>
)}

{activeMenu === "Food Items" && showAddFoodForm && (
  <section className="vendor-section">
    <button
      type="button"
      className="view-all-btn"
      onClick={() => {
        setShowAddFoodForm(false);
        loadFoodItems();
      }}
    >
      ← Back to Food Items
    </button>
     <AddFoodItem
  restaurantId={selectedRestaurant?.id}
  restaurantName={selectedRestaurant?.name}
/>
  </section>
)}

</main>
</div>
);
}

export default VendorDashboard;