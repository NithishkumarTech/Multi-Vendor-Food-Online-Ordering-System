import json
from decimal import Decimal, InvalidOperation

from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout,
)
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from .models import (
    Vendor,
    Restaurant,
    FoodItem,
    MenuCategory,
    Address,
    Order,
    OrderItem,
    Payment,
)
User = get_user_model()


# ==========================================
# VENDOR REGISTRATION
# ==========================================

@csrf_exempt
@require_POST
def vendor_register(request):
    try:
        data = json.loads(request.body)

        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()
        phone = data.get("phone", "").strip()
        password = data.get("password", "")
        business_name = data.get("business_name", "").strip()

        if not all([
            username,
            email,
            phone,
            password,
            business_name,
        ]):
            return JsonResponse(
                {"error": "All fields are required."},
                status=400,
            )

        if len(password) < 8:
            return JsonResponse(
                {"error": "Password must contain at least 8 characters."},
                status=400,
            )

        if User.objects.filter(username=username).exists():
            return JsonResponse(
                {"error": "Username already exists."},
                status=400,
            )

        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse(
                {"error": "Email already exists."},
                status=400,
            )

        if User.objects.filter(phone=phone).exists():
            return JsonResponse(
                {"error": "Phone number already exists."},
                status=400,
            )

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                phone=phone,
                password=password,
                role=User.RESTAURANT,
            )

            Vendor.objects.create(
                user=user,
                business_name=business_name,
                phone=phone,
                is_approved=False,
            )

        return JsonResponse(
            {
                "message": (
                    "Registration successful! "
                    "Your account is waiting for admin approval."
                )
            },
            status=201,
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON data."},
            status=400,
        )

    except Exception:
        return JsonResponse(
            {"error": "Registration failed. Please try again."},
            status=500,
        )


# ==========================================
# VENDOR LOGIN
# ==========================================

@csrf_exempt
@require_POST
def vendor_login(request):
    try:
        data = json.loads(request.body)

        identifier = data.get("email", "").strip()

        if not identifier:
            identifier = data.get("username", "").strip()

        password = data.get("password", "")

        if not identifier or not password:
            return JsonResponse(
                {
                    "error": "Email/phone and password are required."
                },
                status=400,
            )

        user = User.objects.filter(
            email__iexact=identifier
        ).first()

        if user is None:
            user = User.objects.filter(
                phone=identifier
            ).first()

        if user is None:
            user = User.objects.filter(
                username=identifier
            ).first()

        if user is None:
            return JsonResponse(
                {"error": "Invalid email/phone or password."},
                status=401,
            )

        authenticated_user = authenticate(
            request,
            username=user.username,
            password=password,
        )

        if authenticated_user is None:
            return JsonResponse(
                {"error": "Invalid email/phone or password."},
                status=401,
            )

        if authenticated_user.role != User.RESTAURANT:
            return JsonResponse(
                {"error": "This account is not a vendor account."},
                status=403,
            )

        try:
            vendor = Vendor.objects.get(
                user=authenticated_user
            )
        except Vendor.DoesNotExist:
            return JsonResponse(
                {"error": "Vendor account not found."},
                status=403,
            )

        # Vendors can log in before approval.
        login(request, authenticated_user)

        return JsonResponse(
            {
                "message": "Vendor login successful.",
                "username": authenticated_user.username,
                "business_name": vendor.business_name,
                "is_approved": vendor.is_approved,
            },
            status=200,
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON data."},
            status=400,
        )

    except Exception:
        return JsonResponse(
            {"error": "Login failed. Please try again."},
            status=500,
        )


# ==========================================
# CHECK VENDOR LOGIN STATUS
# ==========================================

@require_GET
def vendor_status(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "authenticated": False,
                "error": "Please log in first.",
            },
            status=401,
        )

    try:
        vendor = Vendor.objects.get(
            user=request.user
        )
    except Vendor.DoesNotExist:
        return JsonResponse(
            {
                "authenticated": False,
                "error": "Vendor account not found.",
            },
            status=403,
        )

    return JsonResponse(
        {
            "authenticated": True,
            "username": request.user.username,
            "business_name": vendor.business_name,
            "is_approved": vendor.is_approved,
        }
    )


# ==========================================
# VENDOR LOGOUT
# ==========================================

@csrf_exempt
@require_POST
def vendor_logout(request):
    logout(request)

    return JsonResponse(
        {"message": "Logged out successfully."}
    )


# ==========================================
# CREATE RESTAURANT / BUSINESS DETAILS
# ==========================================

@csrf_exempt
@require_POST
def add_restaurant(request):

    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Please log in first."},
            status=401,
        )

    try:
        vendor = Vendor.objects.get(
            user=request.user
        )
    except Vendor.DoesNotExist:
        return JsonResponse(
            {"error": "You are not registered as a vendor."},
            status=403,
        )

    try:
        data = json.loads(request.body)

        required_fields = [
            "name",
            "phone",
            "address",
            "city",
            "state",
            "pincode",
            "opening_time",
            "closing_time",
        ]

        for field in required_fields:
            value = data.get(field, "")

            if not isinstance(value, str) or not value.strip():
                return JsonResponse(
                    {"error": f"{field} is required."},
                    status=400,
                )

        # Save business details even before admin approval.
        restaurant = Restaurant.objects.create(
            owner=request.user,
            name=data["name"].strip(),
            description=data.get("description", "").strip(),
            phone=data["phone"].strip(),
            email=data.get("email", "").strip(),
            address=data["address"].strip(),
            city=data["city"].strip(),
            state=data["state"].strip(),
            pincode=data["pincode"].strip(),
            opening_time=data["opening_time"],
            closing_time=data["closing_time"],
            is_active=vendor.is_approved,
        )

        if vendor.is_approved:
            message = (
                "Restaurant details saved successfully. "
                "You can now manage your restaurant and menu."
            )
        else:
            message = (
                "Business details submitted successfully. "
                "Your account is awaiting admin approval."
            )

        return JsonResponse(
            {
                "message": message,
                "is_approved": vendor.is_approved,
                "restaurant": {
                    "id": restaurant.id,
                    "name": restaurant.name,
                    "description": restaurant.description,
                    "phone": restaurant.phone,
                    "email": restaurant.email,
                    "address": restaurant.address,
                    "city": restaurant.city,
                    "state": restaurant.state,
                    "pincode": restaurant.pincode,
                    "opening_time": str(
                        restaurant.opening_time
                    ),
                    "closing_time": str(
                        restaurant.closing_time
                    ),
                },
            },
            status=201,
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON data."},
            status=400,
        )

    except (ValueError, TypeError):
        return JsonResponse(
            {"error": "Please check your restaurant details."},
            status=400,
        )

    except Exception:
        return JsonResponse(
            {"error": "Could not create the restaurant."},
            status=500,
        )


# ==========================================
# LIST THE CURRENT VENDOR'S RESTAURANTS
# ==========================================

@require_GET
def my_restaurants(request):

    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Please log in first."},
            status=401,
        )

    try:
        vendor = Vendor.objects.get(
            user=request.user
        )
    except Vendor.DoesNotExist:
        return JsonResponse(
            {"error": "You are not registered as a vendor."},
            status=403,
        )

    restaurants = Restaurant.objects.filter(
        owner=request.user
    ).order_by("-created_at")

    results = []

    for restaurant in restaurants:
        results.append(
            {
                "id": restaurant.id,
                "name": restaurant.name,
                "description": restaurant.description,
                "phone": restaurant.phone,
                "email": restaurant.email,
                "address": restaurant.address,
                "city": restaurant.city,
                "state": restaurant.state,
                "pincode": restaurant.pincode,
                "opening_time": str(
                    restaurant.opening_time
                ),
                "closing_time": str(
                    restaurant.closing_time
                ),
            }
        )

    return JsonResponse(
        {
            "restaurants": results,
            "is_approved": vendor.is_approved,
            "message": (
                "Account approved."
                if vendor.is_approved
                else "Business details are saved and awaiting admin approval."
            ),
        }
    )


# ==========================================
# ADD FOOD ITEM
# POST /api/vendor/food/add/
# ==========================================

@csrf_exempt
@require_POST
def add_food_item(request):

    # 1. Check vendor login.
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Please log in as a vendor first."},
            status=401,
        )

    # 2. Find this vendor.
    try:
        vendor = Vendor.objects.get(
            user=request.user
        )
    except Vendor.DoesNotExist:
        return JsonResponse(
            {"error": "Vendor account not found."},
            status=403,
        )

    # 3. Only approved vendors can add food.
    if not vendor.is_approved:
        return JsonResponse(
            {
                "error": (
                    "Your account is awaiting admin approval. "
                    "You can add food items after approval."
                )
            },
            status=403,
        )

    # 4. Read fields sent by the React FormData form.
    name = request.POST.get("name", "").strip()
    description = request.POST.get("description", "").strip()
    price_text = request.POST.get("price", "").strip()
    quantity_text = request.POST.get("quantity", "0").strip()
    preparation_text = request.POST.get(
        "preparation_time", "20"
    ).strip()

    vegetarian_text = request.POST.get(
        "is_vegetarian", "false"
    ).strip().lower()

    available_text = request.POST.get(
        "is_available", "true"
    ).strip().lower()

    restaurant_id = request.POST.get("restaurant_id", "").strip()
    image_file = request.FILES.get("image")

    # 5. Validate required fields.
    if not name:
        return JsonResponse(
            {"error": "Food name is required."},
            status=400,
        )

    if not price_text:
        return JsonResponse(
            {"error": "Food price is required."},
            status=400,
        )

    try:
        price = Decimal(price_text)
        quantity = int(quantity_text)
        preparation_time = int(preparation_text)

        if not price.is_finite() or price < 0:
            raise ValueError

        if quantity < 0 or preparation_time < 0:
            raise ValueError

    except (InvalidOperation, ValueError, TypeError):
        return JsonResponse(
            {
                "error": (
                    "Enter a valid price, quantity, "
                    "and preparation time."
                )
            },
            status=400,
        )

    is_vegetarian = vegetarian_text in (
        "true", "1", "yes", "veg"
    )

    is_available = available_text in (
        "true", "1", "yes"
    )

    # 6. Find a restaurant owned by the logged-in vendor.
    restaurants = Restaurant.objects.filter(
        owner=request.user
    )

    if restaurant_id:
        restaurant = restaurants.filter(
            id=restaurant_id
        ).first()

        if restaurant is None:
            return JsonResponse(
                {
                    "error": (
                        "The selected restaurant does not "
                        "belong to your vendor account."
                    )
                },
                status=403,
            )
    else:
        restaurant = restaurants.order_by(
            "-created_at"
        ).first()

    if restaurant is None:
        return JsonResponse(
            {
                "error": (
                    "Please submit your restaurant details "
                    "before adding food items."
                )
            },
            status=400,
        )

    # 7. Create a default menu category if necessary.
    try:
        with transaction.atomic():

            menu_category, created = (
                MenuCategory.objects.get_or_create(
                    restaurant=restaurant,
                    name="Main Menu",
                    defaults={
                        "description": "Food items",
                        "is_active": True,
                    },
                )
            )

            # 8. Save the food item in MySQL.
            food_item = FoodItem.objects.create(
                restaurant=restaurant,
                menu_category=menu_category,
                name=name,
                description=description,
                price=price,
                quantity=quantity,
                image=image_file,
                is_vegetarian=is_vegetarian,
                is_available=is_available and quantity > 0,
                preparation_time=preparation_time,
            )

        return JsonResponse(
            {
                "message": "Food item added successfully!",
                "food_item": {
                    "id": food_item.id,
                    "restaurant_id": restaurant.id,
                    "restaurant_name": restaurant.name,
                    "name": food_item.name,
                    "description": food_item.description,
                    "price": str(food_item.price),
                    "quantity": food_item.quantity,
                    "is_vegetarian": food_item.is_vegetarian,
                    "is_available": food_item.is_available,
                    "preparation_time": food_item.preparation_time,
                    "image": (
                        request.build_absolute_uri(
                            food_item.image.url
                        )
                        if food_item.image
                        else None
                    ),
                },
            },
            status=201,
        )

    except Exception:
        return JsonResponse(
            {
                "error": (
                    "Could not save the food item. "
                    "Please check your form and try again."
                )
            },
            status=500,
        )
    # ==========================================
# LIST FOOD ITEMS FOR THE LOGGED-IN VENDOR
# GET /api/vendor/food/
# ==========================================

@require_GET
def vendor_food_items(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Please log in first."},
            status=401,
        )

    try:
        vendor = Vendor.objects.get(user=request.user)
    except Vendor.DoesNotExist:
        return JsonResponse(
            {"error": "Vendor account not found."},
            status=403,
        )

    if not vendor.is_approved:
        return JsonResponse(
            {"error": "Your vendor account is awaiting approval."},
            status=403,
        )

    items = FoodItem.objects.filter(
        restaurant__owner=request.user
    ).select_related(
        "restaurant",
        "menu_category",
    ).order_by("-created_at")

    results = []

    for item in items:
        results.append({
            "id": item.id,
            "restaurant_id": item.restaurant_id,
            "restaurant_name": item.restaurant.name,
            "category": item.menu_category.name,
            "name": item.name,
            "description": item.description,
            "price": str(item.price),
            "quantity": item.quantity,
            "is_vegetarian": item.is_vegetarian,
            "is_available": item.is_available,
            "preparation_time": item.preparation_time,
            "image": (
                request.build_absolute_uri(item.image.url)
                if item.image
                else None
            ),
        })

    return JsonResponse({"food_items": results})


# ==========================================
# UPDATE FOOD ITEM
# PUT/PATCH /api/vendor/food/<food_id>/update/
# ==========================================

@csrf_exempt
def update_food_item(request, food_id):
    if request.method not in ("PUT", "PATCH"):
        return JsonResponse({"success": False, "error": "Method not allowed."}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "Please log in first."}, status=401)

    try:
        vendor = Vendor.objects.get(user=request.user)
    except Vendor.DoesNotExist:
        return JsonResponse({"success": False, "error": "Vendor account not found."}, status=403)

    if not vendor.is_approved:
        return JsonResponse({"success": False, "error": "Your vendor account is awaiting approval."}, status=403)

    food = FoodItem.objects.filter(id=food_id, restaurant__owner=request.user).first()
    if food is None:
        return JsonResponse({"success": False, "error": "Food item not found."}, status=404)

    try:
        data = json.loads(request.body or "{}")
        if not isinstance(data, dict):
            raise ValueError("Invalid food details.")

        if "name" in data:
            name = str(data["name"]).strip()
            if not name:
                return JsonResponse({"success": False, "error": "Food name is required."}, status=400)
            food.name = name

        if "description" in data:
            food.description = str(data["description"])

        if "price" in data:
            price = Decimal(str(data["price"]))
            if not price.is_finite() or price < 0:
                raise ValueError("Price must be zero or greater.")
            food.price = price

        if "quantity" in data:
            quantity = int(data["quantity"])
            if quantity < 0:
                raise ValueError("Quantity cannot be negative.")
            food.quantity = quantity

        if "preparation_time" in data:
            preparation_time = int(data["preparation_time"])
            if preparation_time < 0:
                raise ValueError("Preparation time cannot be negative.")
            food.preparation_time = preparation_time

        for field in ("is_vegetarian", "is_available"):
            if field in data:
                if not isinstance(data[field], bool):
                    raise ValueError(f"{field} must be true or false.")
                setattr(food, field, data[field])

        if food.quantity <= 0:
            food.is_available = False

        food.save()
        return JsonResponse({
            "success": True,
            "message": "Food item updated successfully.",
            "food_item": {
                "id": food.id,
                "restaurant_id": food.restaurant_id,
                "restaurant_name": food.restaurant.name,
                "category": food.menu_category.name if food.menu_category else "Other",
                "name": food.name,
                "description": food.description,
                "price": str(food.price),
                "quantity": food.quantity,
                "is_vegetarian": food.is_vegetarian,
                "is_available": food.is_available,
                "preparation_time": food.preparation_time,
                "image": request.build_absolute_uri(food.image.url) if food.image else None,
            },
        })
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON data."}, status=400)
    except (ValueError, TypeError, InvalidOperation, OverflowError) as error:
        return JsonResponse({"success": False, "error": str(error) or "Please provide valid food details."}, status=400)


# ==========================================
# TOGGLE FOOD AVAILABILITY
# POST /api/vendor/food/<food_id>/availability/
# ==========================================

@csrf_exempt
@require_POST
def toggle_food_availability(request, food_id):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "Please log in first."}, status=401)

    try:
        vendor = Vendor.objects.get(user=request.user)
    except Vendor.DoesNotExist:
        return JsonResponse({"success": False, "error": "Vendor account not found."}, status=403)

    if not vendor.is_approved:
        return JsonResponse({"success": False, "error": "Your vendor account is awaiting approval."}, status=403)

    food = FoodItem.objects.filter(id=food_id, restaurant__owner=request.user).first()
    if food is None:
        return JsonResponse({"success": False, "error": "Food item not found."}, status=404)

    try:
        data = json.loads(request.body or "{}")
        requested_status = data.get("is_available") if isinstance(data, dict) else None
        if not isinstance(requested_status, bool):
            return JsonResponse({"success": False, "error": "Send is_available as true or false."}, status=400)

        if requested_status and food.quantity <= 0:
            return JsonResponse({
                "success": False,
                "error": "Add stock before marking this food item available.",
            }, status=400)

        food.is_available = requested_status
        food.save(update_fields=["is_available", "updated_at"])
        return JsonResponse({
            "success": True,
            "message": "Food item marked available." if food.is_available else "Food item marked out of stock.",
            "is_available": food.is_available,
        })
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON data."}, status=400)


# ==========================================
# DELETE FOOD ITEM
# DELETE /api/vendor/food/<food_id>/delete/
# ==========================================

@csrf_exempt
def delete_food_item(request, food_id):
    if request.method != "DELETE":
        return JsonResponse({"success": False, "error": "Method not allowed."}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "Please log in first."}, status=401)

    try:
        vendor = Vendor.objects.get(user=request.user)
    except Vendor.DoesNotExist:
        return JsonResponse({"success": False, "error": "Vendor account not found."}, status=403)

    if not vendor.is_approved:
        return JsonResponse({"success": False, "error": "Your vendor account is awaiting approval."}, status=403)

    food = FoodItem.objects.filter(id=food_id, restaurant__owner=request.user).first()
    if food is None:
        return JsonResponse({"success": False, "error": "Food item not found."}, status=404)

    food.delete()
    return JsonResponse({"success": True, "message": "Food item deleted successfully."})


# ==========================================
# PUBLIC FOOD API FOR CUSTOMERS
# GET /api/food/
# ==========================================

@require_GET
def customer_food_items(request):
    items = FoodItem.objects.filter(
        restaurant__owner__vendor__is_approved=True,
        restaurant__is_active=True,
        restaurant__is_open=True,
        is_available=True,
        quantity__gt=0,
    ).select_related(
        "restaurant",
        "restaurant__owner",
        "restaurant__owner__vendor",
        "menu_category",
    ).order_by("restaurant__name", "name")

    results = []

    for item in items:
        restaurant = item.restaurant
        results.append({
            "id": item.id,
            "restaurant_id": restaurant.id,
            "restaurant_name": restaurant.name,
            "restaurant_city": restaurant.city,
            "restaurant_logo": (
                request.build_absolute_uri(restaurant.logo.url)
                if restaurant.logo
                else None
            ),
            "restaurant_cover_image": (
                request.build_absolute_uri(restaurant.cover_image.url)
                if restaurant.cover_image
                else None
            ),
            "name": item.name,
            "description": item.description,
            "category": (
                item.menu_category.name
                if item.menu_category
                else "Other"
            ),
            "price": str(item.price),
            "quantity": item.quantity,
            "is_vegetarian": item.is_vegetarian,
            "preparation_time": item.preparation_time,
            "image": (
                request.build_absolute_uri(item.image.url)
                if item.image
                else None
            ),
        })

    return JsonResponse({
        "success": True,
        "count": len(results),
        "food_items": results,
    })

# ==========================================
# PLACE CUSTOMER ORDER
# POST /api/orders/place/
# ==========================================

import uuid
from decimal import Decimal, InvalidOperation
from django.db import transaction


@csrf_exempt
@require_POST
def place_order(request):
    # A customer must be logged in through Django.
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "success": False,
                "error": "Please log in before placing an order.",
            },
            status=401,
        )

    # Parse JSON safely.
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "error": "Invalid JSON request."},
            status=400,
        )

    address_id = data.get("address_id")
    address_data = data.get("address", {})
    payment_method = data.get("payment_method", "cod")
    special_instructions = data.get("special_instructions", "")
    items = data.get("items", [])

    allowed_payment_methods = {
        "cod", "upi", "card", "net_banking", "wallet"
    }
    if payment_method not in allowed_payment_methods:
        return JsonResponse(
            {"success": False, "error": "Invalid payment method."},
            status=400,
        )

    if not isinstance(items, list) or not items:
        return JsonResponse(
            {"success": False, "error": "Your cart is empty."},
            status=400,
        )

    # When address_id is not supplied, checkout sends address details.
    if not address_id:
        if not isinstance(address_data, dict):
            return JsonResponse(
                {"success": False, "error": "Invalid delivery address."},
                status=400,
            )

        required_address_fields = (
            "house_no", "street", "city", "state", "pincode"
        )
        for field in required_address_fields:
            if not str(address_data.get(field, "")).strip():
                return JsonResponse(
                    {
                        "success": False,
                        "error": f"Please provide {field.replace('_', ' ')}.",
                    },
                    status=400,
                )

    try:
        with transaction.atomic():
            # Use an existing address owned by this customer, or save a new one.
            if address_id:
                address = Address.objects.get(
                    id=address_id,
                    user=request.user,
                )
            else:
                address = Address.objects.create(
                    user=request.user,
                    address_type="home",
                    house_no=str(address_data["house_no"]).strip(),
                    street=str(address_data["street"]).strip(),
                    landmark=str(address_data.get("landmark", "")).strip(),
                    city=str(address_data["city"]).strip(),
                    state=str(address_data["state"]).strip(),
                    pincode=str(address_data["pincode"]).strip(),
                    is_default=not Address.objects.filter(
                        user=request.user
                    ).exists(),
                )

            # Validate each food item and calculate prices on the server.
            validated_items = []
            restaurant_ids = set()
            subtotal = Decimal("0.00")

            for item in items:
                if not isinstance(item, dict):
                    raise ValueError("Invalid item in your cart.")

                food_id = item.get("food_item_id", item.get("id"))
                try:
                    food_id = int(food_id)
                    quantity = int(item.get("quantity"))
                except (TypeError, ValueError):
                    raise ValueError(
                        "Each item needs a valid food ID and quantity."
                    )

                if quantity < 1:
                    raise ValueError("Quantity must be at least 1.")

                food = (
                    FoodItem.objects.select_related("restaurant")
                    .filter(
                        id=food_id,
                        is_available=True,
                        restaurant__is_open=True,
                        restaurant__is_active=True,
                        restaurant__owner__vendor__is_approved=True,
                    )
                    .first()
                )
                if food is None:
                    raise ValueError(f"Food item {food_id} is unavailable.")

                if quantity > food.quantity:
                    raise ValueError(f"Not enough stock for {food.name}.")

                line_total = food.price * quantity
                subtotal += line_total
                restaurant_ids.add(food.restaurant_id)
                validated_items.append(
                    {
                        "food": food,
                        "quantity": quantity,
                        "unit_price": food.price,
                        "subtotal": line_total,
                    }
                )

            # Current implementation supports one restaurant per order.
            if len(restaurant_ids) != 1:
                raise ValueError(
                    "Please order items from one restaurant at a time."
                )

            restaurant = validated_items[0]["food"].restaurant

            # Match the checkout page's delivery fee and 5% tax.
            delivery_fee = Decimal("40.00")
            tax = (subtotal * Decimal("0.05")).quantize(Decimal("0.01"))
            discount = Decimal("0.00")
            packaging_fee = Decimal("0.00")
            total_amount = (
                subtotal + delivery_fee + tax - discount + packaging_fee
            )

            # Lock stock rows and re-check quantities before saving.
            food_ids = [entry["food"].id for entry in validated_items]
            locked_foods = {
                food.id: food
                for food in FoodItem.objects.select_for_update().filter(
                    id__in=food_ids
                )
            }

            for entry in validated_items:
                food = locked_foods.get(entry["food"].id)
                if (
                    food is None
                    or not food.is_available
                    or food.quantity < entry["quantity"]
                ):
                    raise ValueError(
                        f"Insufficient stock for {entry['food'].name}."
                    )

            order = Order.objects.create(
                user=request.user,
                restaurant=restaurant,
                address=address,
                order_number="YUM-" + uuid.uuid4().hex[:12].upper(),
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                tax=tax,
                discount=discount,
                packaging_fee=packaging_fee,
                total_amount=total_amount,
                payment_method=payment_method,
                payment_status="pending",
                order_status="pending",
                special_instructions=special_instructions,
            )

            order_items = []
            response_items = []

            for entry in validated_items:
                food = locked_foods[entry["food"].id]
                quantity = entry["quantity"]

                order_items.append(
                    OrderItem(
                        order=order,
                        food_item=food,
                        food_name=food.name,
                        quantity=quantity,
                        unit_price=entry["unit_price"],
                        subtotal=entry["subtotal"],
                    )
                )

                response_items.append(
                    {
                        "food_item_id": food.id,
                        "food_name": food.name,
                        "quantity": quantity,
                        "unit_price": str(entry["unit_price"]),
                        "subtotal": str(entry["subtotal"]),
                    }
                )

                food.quantity -= quantity
                food.save(update_fields=["quantity"])

            OrderItem.objects.bulk_create(order_items)

            Payment.objects.create(
                order=order,
                user=request.user,
                payment_method=payment_method,
                amount=total_amount,
                status="pending",
            )

            response_data = {
                "success": True,
                "message": "Order placed successfully.",
                "order": {
                    "id": order.id,
                    "order_number": order.order_number,
                    "restaurant": restaurant.name,
                    "subtotal": str(order.subtotal),
                    "delivery_fee": str(order.delivery_fee),
                    "tax": str(order.tax),
                    "total_amount": str(order.total_amount),
                    "payment_method": order.payment_method,
                    "payment_status": order.payment_status,
                    "order_status": order.order_status,
                    "created_at": order.created_at.isoformat(),
                },
                "items": response_items,
            }

        return JsonResponse(response_data, status=201)

    except Address.DoesNotExist:
        return JsonResponse(
            {
                "success": False,
                "error": "The selected address was not found for your account.",
            },
            status=400,
        )

    except (ValueError, InvalidOperation) as error:
        return JsonResponse(
            {"success": False, "error": str(error)},
            status=400,
        )

    except Exception:
        import logging
        logging.exception("Failed to place Yumora order")
        return JsonResponse(
            {
                "success": False,
                "error": (
                    "Unable to place the order. "
                    "Check the Django terminal for details."
                ),
            },
            status=500,
        )
