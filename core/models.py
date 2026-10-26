from django.conf import settings
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Address(models.Model):
    ADDRESS_TYPES = [
        ('home', 'Home'),
        ('work', 'Work'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='addresses'
    )
    address_type = models.CharField(
        max_length=20, choices=ADDRESS_TYPES, default='home'
    )
    house_no = models.CharField(max_length=100)
    street = models.CharField(max_length=255)
    landmark = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.house_no}, {self.street}, {self.city}"


class Restaurant(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='restaurants'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    logo = models.ImageField(
        upload_to='restaurants/logos/', blank=True, null=True
    )
    cover_image = models.ImageField(
        upload_to='restaurants/covers/', blank=True, null=True
    )
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    is_open = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    categories = models.ManyToManyField(
        Category, related_name='restaurants', blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class MenuCategory(models.Model):
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='menu_categories'
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.restaurant.name} - {self.name}"


class FoodItem(models.Model):
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='food_items'
    )
    menu_category = models.ForeignKey(
        MenuCategory,
        on_delete=models.CASCADE,
        related_name='food_items'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Price charged for this food item
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # Available stock quantity
    quantity = models.PositiveIntegerField(default=0)

    image = models.ImageField(
        upload_to='food/', blank=True, null=True
    )
    is_vegetarian = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    preparation_time = models.PositiveIntegerField(
        default=20,
        help_text='Preparation time in minutes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class FoodVariant(models.Model):
    food_item = models.ForeignKey(
        FoodItem,
        on_delete=models.CASCADE,
        related_name='variants'
    )
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.food_item.name} - {self.name}"


class Addon(models.Model):
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='addons'
    )
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    food_items = models.ManyToManyField(
        FoodItem, related_name='addons', blank=True
    )

    def __str__(self):
        return self.name


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart'
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='carts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart - {self.user.username}"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart, on_delete=models.CASCADE, related_name='items'
    )
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE)
    variant = models.ForeignKey(
        FoodVariant, on_delete=models.SET_NULL, null=True, blank=True
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.food_item.name} x {self.quantity}"


class Order(models.Model):
    ORDER_STATUS = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('picked_up', 'Picked Up'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_METHODS = [
        ('cod', 'Cash on Delivery'),
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('net_banking', 'Net Banking'),
        ('wallet', 'Wallet'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.PROTECT, related_name='orders'
    )
    address = models.ForeignKey(
        Address, on_delete=models.PROTECT, related_name='orders'
    )
    order_number = models.CharField(max_length=30, unique=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    packaging_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=30, choices=PAYMENT_METHODS
    )
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS, default='pending'
    )
    order_status = models.CharField(
        max_length=30, choices=ORDER_STATUS, default='pending'
    )
    special_instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='items'
    )
    food_item = models.ForeignKey(FoodItem, on_delete=models.PROTECT)
    food_name = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.food_name} x {self.quantity}"


class Payment(models.Model):
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name='payment'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    payment_method = models.CharField(max_length=30)
    transaction_id = models.CharField(
        max_length=100, unique=True, null=True, blank=True
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS, default='pending'
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class DeliveryPartner(models.Model):
    VEHICLE_TYPES = [
        ('bike', 'Bike'),
        ('scooter', 'Scooter'),
        ('cycle', 'Cycle'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='delivery_profile'
    )
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    vehicle_number = models.CharField(max_length=30, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    is_available = models.BooleanField(default=False)
    current_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    current_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


class Delivery(models.Model):
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('picked_up', 'Picked Up'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
    ]

    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name='delivery'
    )
    delivery_partner = models.ForeignKey(
        DeliveryPartner,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deliveries'
    )
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default='assigned'
    )
    pickup_time = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    out_for_delivery_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    pickup_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    pickup_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    delivery_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    delivery_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='reviews'
    )
    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name='review'
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.restaurant.name} - {self.rating}"


class Coupon(models.Model):
    DISCOUNT_TYPES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]

    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    discount_type = models.CharField(
        max_length=20, choices=DISCOUNT_TYPES
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_order_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    maximum_discount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    start_date = models.DateTimeField()
    expiry_date = models.DateTimeField()
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code


class CouponUsage(models.Model):
    coupon = models.ForeignKey(
        Coupon, on_delete=models.CASCADE, related_name='usages'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='coupon_usages'
    )
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='coupon_usages'
    )
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)


class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'restaurant'],
                name='unique_user_restaurant_favorite'
            )
        ]


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='status_history'
    )
    status = models.CharField(max_length=30)
    note = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.status}"


class Refund(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name='refunds'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='requested'
    )
    created_at = models.DateTimeField(auto_now_add=True)


class Cancellation(models.Model):
    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name='cancellation'
    )
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    reason = models.TextField()
    cancelled_at = models.DateTimeField(auto_now_add=True)


class Complaint(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='complaints'
    )
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='complaints'
    )
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='open'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_tickets'
    )
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='open'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class RestaurantHours(models.Model):
    DAYS = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='hours'
    )
    day = models.PositiveSmallIntegerField(choices=DAYS)
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    is_closed = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['restaurant', 'day'],
                name='unique_restaurant_day'
            )
        ]


class RestaurantDocument(models.Model):
    DOCUMENT_TYPES = [
        ('license', 'License'),
        ('gst', 'GST'),
        ('fssai', 'FSSAI'),
        ('other', 'Other'),
    ]

    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='documents'
    )
    document_type = models.CharField(
        max_length=30, choices=DOCUMENT_TYPES
    )
    document_number = models.CharField(max_length=100, blank=True)
    document_file = models.FileField(upload_to='restaurant_documents/')
    is_verified = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Offer(models.Model):
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='offers'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2
    )
    minimum_order_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Vendor(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    business_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.business_name