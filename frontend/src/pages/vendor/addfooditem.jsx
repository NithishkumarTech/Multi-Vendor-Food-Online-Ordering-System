
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

function AddFoodItem({ restaurantId, restaurantName }) {
  const navigate = useNavigate();

  const [food, setFood] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    is_vegetarian: true,
    preparation_time: "20",
    is_available: true,
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [image]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFood((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (event) => {
    const selectedImage = event.target.files?.[0];

    setMessage("");
    setImage(null);

    if (!selectedImage) return;

    if (!selectedImage.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (selectedImage.size > 5 * 1024 * 1024) {
      setMessage("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setImage(selectedImage);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("error");

    if (!restaurantId) {
      setMessage("Please select a restaurant before adding food.");
      return;
    }

    if (!image) {
      setMessage("Please select a food image.");
      return;
    }

    if (Number(food.price) <= 0) {
      setMessage("Food price must be greater than zero.");
      return;
    }

    if (!Number.isInteger(Number(food.quantity)) || Number(food.quantity) < 0) {
      setMessage("Please enter a valid food quantity.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(food).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      formData.append("image", image);
      formData.append("restaurant_id", String(restaurantId));

      const response = await fetch("/api/vendor/food/add/", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Unable to save food item."
        );
      }

      setMessageType("success");
      setMessage("Food item added successfully!");

      window.alert("Food item added successfully!");

      navigate("/vendor/dashboard");
    } catch (error) {
      console.error("Add food item error:", error);
      setMessage(error.message || "Unable to connect to Django.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button
          type="button"
          style={styles.backButton}
          onClick={() => navigate("/vendor/dashboard")}
          disabled={loading}
        >
          ← Back to Dashboard
        </button>

        <h1 style={styles.title}>🍽️ Add Food Item</h1>

        <p style={styles.subtitle}>
          Restaurant: {restaurantName || "Selected restaurant"}
        </p>

        <p style={styles.subtitle}>
          Add your food details and upload a clear photo of the actual dish.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label} htmlFor="food-name">
            Food Item Name *
          </label>
          <input
            id="food-name"
            style={styles.input}
            name="name"
            value={food.name}
            onChange={handleChange}
            placeholder="Example: Chicken Biryani"
            maxLength={150}
            required
          />

          <label style={styles.label} htmlFor="food-description">
            Description
          </label>
          <textarea
            id="food-description"
            style={styles.input}
            name="description"
            value={food.description}
            onChange={handleChange}
            placeholder="Describe your food item"
            rows="3"
          />

          <label style={styles.label} htmlFor="food-image">
            Food Image *
          </label>

          <p style={styles.helpText}>
            Upload a photo of this specific dish. JPG, PNG, and WebP images
            up to 5 MB are supported.
          </p>

          <input
            id="food-image"
            style={styles.input}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            required
          />

          {imagePreview && (
            <div style={styles.previewContainer}>
              <img
                src={imagePreview}
                alt={`Preview of ${food.name || "selected food"}`}
                style={styles.preview}
              />
              <p style={styles.previewCaption}>
                Image preview — this photo will be uploaded with your food item.
              </p>
              <button
                type="button"
                style={styles.removeImageButton}
                onClick={() => {
                  setImage(null);
                  setMessage("");
                  const input = document.getElementById("food-image");
                  if (input) input.value = "";
                }}
              >
                Remove Image
              </button>
            </div>
          )}

          <label style={styles.label} htmlFor="food-price">
            Price (₹) *
          </label>
          <input
            id="food-price"
            style={styles.input}
            type="number"
            name="price"
            value={food.price}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            placeholder="250"
            required
          />

          <label style={styles.label} htmlFor="food-quantity">
            Available Quantity *
          </label>
          <input
            id="food-quantity"
            style={styles.input}
            type="number"
            name="quantity"
            value={food.quantity}
            onChange={handleChange}
            min="0"
            step="1"
            placeholder="30"
            required
          />

          <label style={styles.label} htmlFor="preparation-time">
            Preparation Time (minutes) *
          </label>
          <input
            id="preparation-time"
            style={styles.input}
            type="number"
            name="preparation_time"
            value={food.preparation_time}
            onChange={handleChange}
            min="1"
            step="1"
            required
          />

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_vegetarian"
              checked={food.is_vegetarian}
              onChange={handleChange}
            />
            Vegetarian
          </label>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_available"
              checked={food.is_available}
              onChange={handleChange}
            />
            Food is available
          </label>

          {message && (
            <p
              role="status"
              aria-live="polite"
              style={messageType === "success" ? styles.success : styles.error}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            style={{
              ...styles.saveButton,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? "Uploading and Saving..." : "Save Food Item"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7f5",
    padding: "35px 15px",
  },
  card: {
    maxWidth: "650px",
    margin: "0 auto",
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#15803d",
    cursor: "pointer",
    fontSize: "15px",
    marginBottom: "15px",
  },
  title: {
    color: "#166534",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#666",
    marginBottom: "18px",
  },
  label: {
    display: "block",
    fontWeight: "600",
    marginTop: "17px",
    marginBottom: "7px",
  },
  helpText: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "15px",
  },
  previewContainer: {
    marginTop: "14px",
    padding: "14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
  },
  preview: {
    width: "100%",
    maxWidth: "320px",
    height: "210px",
    display: "block",
    objectFit: "cover",
    borderRadius: "8px",
  },
  previewCaption: {
    color: "#166534",
    fontSize: "13px",
    marginTop: "10px",
  },
  removeImageButton: {
    background: "#fff",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "7px",
    padding: "8px 12px",
    cursor: "pointer",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "16px",
  },
  error: {
    color: "#dc2626",
    marginTop: "15px",
  },
  success: {
    color: "#15803d",
    marginTop: "15px",
  },
  saveButton: {
    width: "100%",
    padding: "14px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    marginTop: "25px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default AddFoodItem;

