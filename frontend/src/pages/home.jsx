import { useEffect, useState } from "react";
import { Link } from "react-router";

function Home() {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch food items from Django
  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/food/"
        );

        if (!response.ok) {
          throw new Error("Unable to load food items.");
        }

        const data = await response.json();

        setFoodItems(data.food_items || []);
        setApiError("");
      } catch (error) {
        console.error("Error fetching food items:", error);
        setApiError(
          "Unable to load food items. Please check your server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFoodItems();
  }, []);

  // Close live suggestions when clicking outside the search area
  useEffect(() => {
    const closeSuggestions = (event) => {
      if (!event.target.closest(".search-box") &&
          !event.target.closest(".yumora-live-search-results")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", closeSuggestions);
    return () => document.removeEventListener("mousedown", closeSuggestions);
  }, []);

  // Group food items into restaurants
  const restaurants = [
    ...new Map(
      foodItems.map((item) => [
        item.restaurant_id,
        {
          id: item.restaurant_id,
          name: item.restaurant_name,
          image: item.restaurant_cover_image || item.restaurant_logo || item.image || null,
          description: item.restaurant_city || "Restaurant",
          rating: "New",
          delivery: `${item.preparation_time || 30} min`,
          categories: [
            ...new Set(
              foodItems
                .filter(
                  (food) =>
                    food.restaurant_id === item.restaurant_id
                )
                .map((food) => food.category)
                .filter(Boolean)
            ),
          ],
          dishes: foodItems
            .filter(
              (food) =>
                food.restaurant_id === item.restaurant_id
            )
            .map((food) => food.name),
        },
      ])
    ).values(),
  ];

  // Categories
  const categories = [
    {
      name: "Pizza",
      image: "/images/pizza.jpg",
    },
    {
      name: "Burgers",
      image: "/images/burger.jpg",
    },
    {
      name: "Biryani",
      image: "/images/biryani.jpg",
    },
    {
      name: "Chinese",
      image: "/images/chinese.jpg",
    },
    {
      name: "Healthy",
      image: "/images/healthy.jpg",
    },
    {
      name: "Desserts",
      image: "/images/dessert.jpg",
    },
  ];

  // Search and category filtering for restaurants
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const search = searchText.toLowerCase().trim();

    const matchesSearch =
      search === "" ||
      restaurant.name.toLowerCase().includes(search) ||
      restaurant.description.toLowerCase().includes(search) ||
      restaurant.categories.some((category) =>
        category.toLowerCase().includes(search)
      ) ||
      restaurant.dishes.some((dish) =>
        dish.toLowerCase().includes(search)
      );

    const matchesCategory =
      activeCategory === "All" ||
      restaurant.categories.some(
        (category) =>
          category.toLowerCase() === activeCategory.toLowerCase()
      ) ||
      restaurant.dishes.some(
        (dish) =>
          dish.toLowerCase() === activeCategory.toLowerCase()
      );

    return matchesSearch && matchesCategory;
  });

  // Search and category filtering for food items
  const filteredFoodItems = foodItems.filter((item) => {
    const search = searchText.toLowerCase().trim();

    const matchesSearch =
      search === "" ||
      item.name?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      item.restaurant_name?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search);

    const matchesCategory =
      activeCategory === "All" ||
      item.category?.toLowerCase() ===
        activeCategory.toLowerCase() ||
      item.name?.toLowerCase().includes(
        activeCategory.toLowerCase()
      );

    return matchesSearch && matchesCategory;
  });

  // Live search suggestions shown directly below the search bar
  const normalizedSearch = searchText.trim().toLowerCase();

  // Remove duplicate food suggestions with the same restaurant, name and price.
  const suggestionFoodItems = [
    ...new Map(
      foodItems
        .filter((item) => {
          if (!normalizedSearch) return true;
          return (
            item.name?.toLowerCase().includes(normalizedSearch) ||
            item.restaurant_name?.toLowerCase().includes(normalizedSearch) ||
            item.category?.toLowerCase().includes(normalizedSearch) ||
            item.description?.toLowerCase().includes(normalizedSearch)
          );
        })
        .map((item) => [
          `${item.restaurant_id}-${item.name?.trim().toLowerCase()}-${item.price}`,
          item,
        ])
    ).values(),
  ].slice(0, 5);

  const suggestionRestaurants = restaurants
    .filter((restaurant) => {
      if (!normalizedSearch) return true;
      return (
        restaurant.name?.toLowerCase().includes(normalizedSearch) ||
        restaurant.description?.toLowerCase().includes(normalizedSearch) ||
        restaurant.dishes.some((dish) =>
          dish.toLowerCase().includes(normalizedSearch)
        )
      );
    })
    .slice(0, 4);

  const openRestaurant = (restaurantId) => {
    setShowSuggestions(false);
    window.location.href = `/restaurants/${restaurantId}`;
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setSearchText("");
  };

  const clearSearch = () => {
    setSearchText("");
    setActiveCategory("All");
  };

  const scrollToRestaurants = () => {
    document
      .getElementById("restaurants")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-page">
      {/* HERO SECTION */}

      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-small-text">Welcome to Yumora</p>

          <h1>
            Delicious food,
            <br />
            delivered to your door.
          </h1>

          <p className="hero-description">
            Discover restaurants, explore delicious dishes,
            and order your favorite food with Yumora.
          </p>

          {/* SEARCH */}

          <div style={{ position: "relative", width: "100%", zIndex: 20 }}>
            <div className="search-box">
              <span className="search-icon">🔍</span>

              <input
                type="text"
                value={searchText}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowSuggestions(false);
                  if (e.key === "Enter") {
                    setShowSuggestions(false);
                    document.getElementById("restaurants")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                placeholder="Search restaurants or dishes..."
                aria-label="Search restaurants or food"
                autoComplete="off"
              />

              {searchText && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => {
                    clearSearch();
                    setShowSuggestions(true);
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  document.getElementById("restaurants")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                Search
              </button>
            </div>

            {showSuggestions && (
              <div
                className="yumora-live-search-results"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  maxHeight: "360px",
                  overflowY: "auto",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
                  padding: "10px",
                  color: "#172033",
                  textAlign: "left",
                }}
              >
                {loading ? (
                  <p style={{ padding: "12px", margin: 0 }}>Loading food suggestions…</p>
                ) : apiError ? (
                  <p style={{ padding: "12px", margin: 0 }}>{apiError}</p>
                ) : suggestionFoodItems.length === 0 &&
                  suggestionRestaurants.length === 0 ? (
                  <p style={{ padding: "12px", margin: 0 }}>
                    No matching food or restaurants found.
                  </p>
                ) : (
                  <>
                    {suggestionFoodItems.length > 0 && (
                      <div>
                        <p style={{ margin: "6px 8px", fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                          Food items
                        </p>
                        {suggestionFoodItems.map((item) => (
                          <button
                            type="button"
                            key={`food-${item.id}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => openRestaurant(item.restaurant_id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              width: "100%",
                              padding: "9px 8px",
                              border: 0,
                              borderRadius: "9px",
                              background: "transparent",
                              cursor: "pointer",
                              textAlign: "left",
                              color: "#172033",
                            }}
                          >
                            ```jsx
<img
  src={
    item.image
      ? `http://127.0.0.1:8000${item.image.startsWith("/") ? "" : "/"}${item.image}`
      : "/images/biryani.jpg"
  }
  alt={item.name}
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/images/biryani.jpg";
  }}
  style={{
    width: "44px",
    height: "44px",
    objectFit: "cover",
    borderRadius: "8px",
    flexShrink: 0,
  }}
/>
```

                            <span style={{ minWidth: 0, flex: 1 }}>
                              <strong style={{ display: "block" }}>{item.name}</strong>
                              <small style={{ color: "#64748b" }}>{item.restaurant_name} · ₹{Number(item.price).toFixed(2)}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {suggestionRestaurants.length > 0 && (
                      <div style={{ borderTop: suggestionFoodItems.length ? "1px solid #e5e7eb" : 0, marginTop: "6px", paddingTop: "6px" }}>
                        <p style={{ margin: "6px 8px", fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                          Restaurants
                        </p>
                        {suggestionRestaurants.map((restaurant) => (
                          <button
                            type="button"
                            key={`restaurant-${restaurant.id}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => openRestaurant(restaurant.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              width: "100%",
                              padding: "10px 8px",
                              border: 0,
                              borderRadius: "9px",
                              background: "transparent",
                              cursor: "pointer",
                              textAlign: "left",
                              color: "#172033",
                            }}
                          >
                            {restaurant.image ? (
                              <img
                                src={restaurant.image}
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "/images/restaurant-placeholder.png";
                                }}
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "8px",
                                  objectFit: "cover",
                                  flexShrink: 0,
                                  background: "#f1f5f9",
                                }}
                              />
                            ) : (
                              <span style={{ width: "44px", height: "44px", borderRadius: "8px", background: "#f1f5f9", display: "grid", placeItems: "center", fontSize: "22px", flexShrink: 0 }}>🍽️</span>
                            )}
                            <span>
                              <strong style={{ display: "block" }}>{restaurant.name}</strong>
                              <small style={{ color: "#64748b" }}>{restaurant.description}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}

      <section className="categories-section">
        <div className="section-heading">
          <h2>Explore Categories</h2>
          <p>What are you craving today?</p>
        </div>

        <div className="category-list">
          <div
            className={`category-card ${
              activeCategory === "All" ? "active-category" : ""
            }`}
            onClick={() => handleCategoryClick("All")}
            style={{ cursor: "pointer" }}
          >
            <div className="category-icon">
              <span style={{ fontSize: "40px" }}>🍽️</span>
            </div>
            <h3>All</h3>
          </div>

          {categories.map((category) => (
            <div
              className={`category-card ${
                activeCategory === category.name
                  ? "active-category"
                  : ""
              }`}
              key={category.name}
              onClick={() => handleCategoryClick(category.name)}
              style={{ cursor: "pointer" }}
            >
              <div className="category-icon">
                <img
                  src={category.image}
                  alt={category.name}
                />
              </div>

              <h3>{category.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* OFFER SECTION */}

      <section className="offer-section">
        <div className="offer-content">
          <p>YUMORA SPECIAL</p>

          <h2>Get 50% OFF</h2>

          <span>On your first order</span>

          <button onClick={scrollToRestaurants}>
            Order Now
          </button>
        </div>
      </section>

      {/* RESTAURANTS */}

      <section
        className="restaurants-section"
        id="restaurants"
      >
        <div className="section-heading">
          <h2>
            {searchText || activeCategory !== "All"
              ? "Search Results"
              : "Restaurants on Yumora"}
          </h2>

          <p>
            {searchText
              ? `Showing results for "${searchText}"`
              : activeCategory !== "All"
              ? `Restaurants serving ${activeCategory}`
              : "Discover restaurants and their delicious menus."}
          </p>
        </div>

        {(searchText || activeCategory !== "All") && (
          <div className="active-filter">
            <span>
              {activeCategory !== "All"
                ? activeCategory
                : `"${searchText}"`}
            </span>

            <button onClick={clearSearch}>
              Clear ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="no-results">
            <h3>Loading restaurants...</h3>
            <p>Please wait while we load the menu.</p>
          </div>
        ) : apiError ? (
          <div className="no-results">
            <h3>Unable to load restaurants</h3>
            <p>{apiError}</p>
            <button onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="restaurant-grid">
            {filteredRestaurants.map((restaurant) => (
              <div
                className="restaurant-card"
                key={restaurant.id}
              >
                <Link
                  to={`/restaurants/${restaurant.id}`}
                  className="restaurant-card-link"
                >
                  <div className="restaurant-image">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      onError={(e) => {
                        e.currentTarget.src =
                          "/images/biryani.jpg";
                      }}
                    />

                    {restaurant.discount && (
                      <span className="discount-badge">
                        {restaurant.discount}
                      </span>
                    )}
                  </div>

                  <div className="restaurant-info">
                    <h3>{restaurant.name}</h3>

                    <p>{restaurant.description}</p>

                    <div className="restaurant-meta">
                      <span>⭐ {restaurant.rating}</span>
                      <span>{restaurant.delivery}</span>
                    </div>
                  </div>
                </Link>

                <button
                  className="favorite-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    e.currentTarget.classList.toggle("liked");

                    e.currentTarget.textContent =
                      e.currentTarget.classList.contains("liked")
                        ? "♥"
                        : "♡";
                  }}
                >
                  ♡
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>

            <h3>No restaurants found</h3>

            <p>
              We couldn't find a restaurant matching your search.
            </p>

            <button onClick={clearSearch}>
              Show All Restaurants
            </button>
          </div>
        )}
      </section>

      {/* FOOD MENU */}

      <section className="restaurants-section">
        <div className="section-heading">
          <h2>
            {searchText || activeCategory !== "All"
              ? "Matching Food Items"
              : "Fresh from Our Restaurants"}
          </h2>

          <p>
            Explore food items added by our restaurant partners.
          </p>
        </div>

        {!loading && !apiError && filteredFoodItems.length > 0 ? (
          <div
            className="food-items-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "24px",
            }}
          >
            {filteredFoodItems.map((item) => (
             <article
  key={item.id}
  className="food-item-card"
  onClick={() => {
    window.location.href = `/restaurants/${item.restaurant_id}`;
  }}
  style={{ cursor: "pointer" }}
              >
                <img
                  src={item.image || "/images/biryani.jpg"}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.src = "/images/biryani.jpg";
                  }}
                  style={{
                    width: "100%",
                    height: "190px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                <div style={{ padding: "18px" }}>
                  <span
                    style={{
                      color: "#159447",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {item.category || "Main Menu"}
                  </span>

                  <h3 style={{ margin: "8px 0" }}>
                    {item.name}
                  </h3>

                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      minHeight: "38px",
                    }}
                  >
                    {item.description || "Freshly prepared food"}
                  </p>

                  <p
                    style={{
                      fontWeight: "600",
                      color: "#159447",
                      margin: "10px 0 5px",
                    }}
                  >
                    {item.restaurant_name}
                  </p>

                  <p style={{ color: "#172554", fontSize: "20px" }}>
                    ₹{Number(item.price).toFixed(2)}
                  </p>

                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    {item.quantity > 0
                      ? `Available: ${item.quantity}`
                      : "Currently unavailable"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : !loading && !apiError ? (
          <div className="no-results">
            <h3>No food items found</h3>
            <p>
              Try another category or check back later for new dishes.
            </p>

            {(searchText || activeCategory !== "All") && (
              <button onClick={clearSearch}>
                Show All Food Items
              </button>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default Home;