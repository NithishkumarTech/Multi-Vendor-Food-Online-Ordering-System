from django.contrib import admin, messages
from django.utils.html import format_html

from .models import Vendor, Restaurant


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "business_name",
        "phone",
        "approval_status",
        "created_at",
    )

    list_display_links = (
        "user",
        "business_name",
    )

    list_filter = (
        "is_approved",
    )

    search_fields = (
        "business_name",
        "phone",
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "created_at",
    )

    actions = (
        "activate_vendors",
        "set_vendors_pending",
        "reject_vendors",
    )

    @admin.display(description="Approval Status")
    def approval_status(self, obj):
        if obj.is_approved:
            return format_html(
                '<span style="color:green;font-weight:bold;">'
                'ACTIVATED'
                '</span>'
            )

        return format_html(
            '<span style="color:#d97706;font-weight:bold;">'
            'PENDING'
            '</span>'
        )

    @admin.action(description="Activate selected vendors")
    def activate_vendors(self, request, queryset):
        activated_count = 0

        for vendor in queryset:
            vendor.is_approved = True
            vendor.save(update_fields=["is_approved"])

            # Activate restaurants already created by this vendor.
            Restaurant.objects.filter(
                owner=vendor.user
            ).update(
                is_active=True
            )

            activated_count += 1

        self.message_user(
            request,
            (
                f"{activated_count} vendor(s) activated "
                "and their existing restaurants activated."
            ),
            messages.SUCCESS,
        )

    @admin.action(description="Set selected vendors to Pending")
    def set_vendors_pending(self, request, queryset):
        pending_count = 0

        for vendor in queryset:
            vendor.is_approved = False
            vendor.save(update_fields=["is_approved"])

            # Prevent pending vendors' restaurants from being active.
            Restaurant.objects.filter(
                owner=vendor.user
            ).update(
                is_active=False
            )

            pending_count += 1

        self.message_user(
            request,
            (
                f"{pending_count} vendor(s) set to pending. "
                "Their restaurants have been deactivated."
            ),
            messages.WARNING,
        )

    @admin.action(description="Reject selected vendors")
    def reject_vendors(self, request, queryset):
        rejected_count = 0

        for vendor in queryset:
            vendor.is_approved = False
            vendor.save(update_fields=["is_approved"])

            Restaurant.objects.filter(
                owner=vendor.user
            ).update(
                is_active=False
            )

            rejected_count += 1

        self.message_user(
            request,
            (
                f"{rejected_count} vendor(s) rejected. "
                "Their restaurants have been deactivated."
            ),
            messages.WARNING,
        )


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "owner",
        "phone",
        "city",
        "state",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
        "city",
        "state",
    )

    search_fields = (
        "name",
        "owner__username",
        "phone",
        "email",
        "city",
        "address",
    )

    readonly_fields = (
        "created_at",
    )