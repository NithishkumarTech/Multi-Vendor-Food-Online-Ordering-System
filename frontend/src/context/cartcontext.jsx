import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Add item to cart
  const addToCart = (item) => {
    setCartItems((currentItems) => {
      // Check if item already exists
      const existingItem = currentItems.find(
        (cartItem) => cartItem.id === item.id
      );

      // If item already exists, increase quantity
      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: Math.min(50, cartItem.quantity + 1),
              }
            : cartItem
        );
      }

      // Add new item
      return [
        ...currentItems,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };


  // Increase quantity
  const increaseQuantity = (id) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(50, item.quantity + 1),
            }
          : item
      )
    );
  };


  // Decrease quantity
  const decreaseQuantity = (id) => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };


  // Remove complete item
  const removeFromCart = (id) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    );
  };


  // Empty cart
  const clearCart = () => {
    setCartItems([]);
  };


  // Replace current cart with a new restaurant item
  const replaceCart = (item) => {
    setCartItems([
      {
        ...item,
        quantity: 1,
      },
    ]);
  };


  // Total number of items
  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );


  // Total price
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );


  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        replaceCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}


export function useCart() {
  return useContext(CartContext);
}