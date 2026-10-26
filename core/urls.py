
from django.urls import path
from . import views

urlpatterns = [
    # Vendor registration
    path(
        "vendor/register/",
        views.vendor_register,
        name="vendor_register",
    ),

    # Vendor login
    path(
        "vendor/login/",
        views.vendor_login,
        name="vendor_login",
    ),

    # Check vendor login status
    path(
        "vendor/status/",
        views.vendor_status,
        name="vendor_status",
    ),

    # Vendor logout
    path(
        "vendor/logout/",
        views.vendor_logout,
        name="vendor_logout",
    ),

    # List the logged-in vendor's restaurants
    path(
        "vendor/restaurants/",
        views.my_restaurants,
        name="my_restaurants",
    ),

    # Add a new restaurant
    path(
        "vendor/restaurants/add/",
        views.add_restaurant,
        name="add_restaurant",
    ),

    # Add a food item
    path(
        "vendor/food/add/",
        views.add_food_item,
        name="add_food_item",
    ),

    # List food items for the logged-in vendor
    path(
        "vendor/food/",
        views.vendor_food_items,
        name="vendor_food_items",
    ),

    # Edit an existing food item
    path(
        "vendor/food/<int:food_id>/update/",
        views.update_food_item,
        name="update_food_item",
    ),

    # Mark a food item Available or Out of Stock
    path(
        "vendor/food/<int:food_id>/availability/",
        views.toggle_food_availability,
        name="toggle_food_availability",
    ),

    # Permanently delete a food item
    path(
        "vendor/food/<int:food_id>/delete/",
        views.delete_food_item,
        name="delete_food_item",
    ),

    # Public food list for customers
    path(
        "food/",
        views.customer_food_items,
        name="customer_food_items",
    ),

    # Place a customer order
    path(
        "orders/place/",
        views.place_order,
        name="place_order",
    ),
]

