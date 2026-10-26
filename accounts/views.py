import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


User = get_user_model()


@csrf_exempt
@require_POST
def customer_register(request):
    try:
        data = json.loads(request.body or "{}")

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        phone = data.get("phone", "").strip()
        password = data.get("password", "")
        confirm_password = data.get("confirmPassword", "")

        if not all([name, email, phone, password]):
            return JsonResponse({
                "success": False,
                "message": "Please fill in all required fields."
            }, status=400)

        if len(password) < 8:
            return JsonResponse({
                "success": False,
                "message": "Password must contain at least 8 characters."
            }, status=400)

        if confirm_password and password != confirm_password:
            return JsonResponse({
                "success": False,
                "message": "Passwords do not match."
            }, status=400)

        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse({
                "success": False,
                "message": "This email is already registered."
            }, status=400)

        if User.objects.filter(phone=phone).exists():
            return JsonResponse({
                "success": False,
                "message": "This phone number is already registered."
            }, status=400)

        username = email

        if User.objects.filter(username=username).exists():
            return JsonResponse({
                "success": False,
                "message": "An account with this username already exists."
            }, status=400)

        user = User.objects.create_user(
            username=username,
            first_name=name,
            email=email,
            phone=phone,
            password=password,
            role=User.CUSTOMER,
        )

        login(request, user)

        return JsonResponse({
            "success": True,
            "message": "Registration successful.",
            "user": {
                "id": user.id,
                "name": user.first_name,
                "email": user.email,
                "phone": user.phone,
            }
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({
            "success": False,
            "message": "Invalid request data."
        }, status=400)

    except Exception:
        return JsonResponse({
            "success": False,
            "message": "Registration failed. Please try again."
        }, status=500)


@csrf_exempt
@require_POST
def customer_login(request):
    try:
        data = json.loads(request.body or "{}")

        identifier = data.get("identifier", "").strip()
        password = data.get("password", "")

        if not identifier or not password:
            return JsonResponse({
                "success": False,
                "message": "Enter your email or phone number and password."
            }, status=400)

        user_record = User.objects.filter(
            email__iexact=identifier
        ).first()

        if not user_record:
            user_record = User.objects.filter(
                phone=identifier
            ).first()

        if not user_record:
            return JsonResponse({
                "success": False,
                "message": "Invalid email/phone or password."
            }, status=401)

        user = authenticate(
            request,
            username=user_record.username,
            password=password,
        )

        if user is None:
            return JsonResponse({
                "success": False,
                "message": "Invalid email/phone or password."
            }, status=401)

        if user.role != User.CUSTOMER:
            return JsonResponse({
                "success": False,
                "message": "Please use the correct login page."
            }, status=403)

        login(request, user)

        return JsonResponse({
            "success": True,
            "message": "Login successful.",
            "user": {
                "id": user.id,
                "name": user.first_name,
                "email": user.email,
                "phone": user.phone,
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({
            "success": False,
            "message": "Invalid request data."
        }, status=400)

    except Exception:
        return JsonResponse({
            "success": False,
            "message": "Login failed. Please try again."
        }, status=500)


@csrf_exempt
@require_POST
def customer_logout(request):
    logout(request)

    return JsonResponse({
        "success": True,
        "message": "Logged out successfully."
    })

