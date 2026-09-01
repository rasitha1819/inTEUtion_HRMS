from rest_framework import permissions
from .models import RoleChoices


class IsAdminRole(permissions.BasePermission):
    """Allows access only to users with ADMIN role or superusers."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.role == RoleChoices.ADMIN or request.user.is_superuser)
        )


class IsHRRole(permissions.BasePermission):
    """Allows access only to users with HR role."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role == RoleChoices.HR
        )


class IsHRorAdmin(permissions.BasePermission):
    """Allows access to users with ADMIN or HR roles."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.role in [RoleChoices.ADMIN, RoleChoices.HR] or request.user.is_superuser)
        )


class IsSelfOrHRAdmin(permissions.BasePermission):
    """Allows access to object owners or HR/Admin users."""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in [RoleChoices.ADMIN, RoleChoices.HR] or request.user.is_superuser:
            return True
        # Check if the object is user or has a user/employee relationship
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'employee') and hasattr(obj.employee, 'user'):
            return obj.employee.user == request.user
        return obj == request.user
