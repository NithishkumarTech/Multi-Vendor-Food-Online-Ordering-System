
# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    CUSTOMER = 'customer'
    RESTAURANT = 'restaurant'
    DELIVERY = 'delivery'
    ADMIN = 'admin'

    ROLE_CHOICES = [
        (CUSTOMER, 'Customer'),
        (RESTAURANT, 'Restaurant Owner'),
        (DELIVERY, 'Delivery Partner'),
        (ADMIN, 'Admin'),
    ]

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, unique=True)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=CUSTOMER
    )

    def __str__(self):
        return self.username