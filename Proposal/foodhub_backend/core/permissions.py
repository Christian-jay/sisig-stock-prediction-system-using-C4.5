"""
Custom permission classes for FOODHUB API.
"""
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class IsStaffUser(permissions.BasePermission):
    """
    Allows access to staff and admin users.
    """
    message = 'Staff access required.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('STAFF', 'ADMIN'))


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `owner` or `user` field.
    """
    message = 'You do not have permission to modify this object.'

    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for owner or admin
        owner = getattr(obj, 'user', None) or getattr(obj, 'owner', None) or getattr(obj, 'created_by', None)
        return bool(request.user and request.user.is_authenticated and (
            request.user.role == 'ADMIN' or owner == request.user
        ))


class CanManageInventory(permissions.BasePermission):
    """
    Permission for inventory management operations.
    Admins can do everything. Staff can view and update quantities.
    """
    message = 'Insufficient permissions for inventory operation.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN':
            return True
        if request.user.role == 'STAFF':
            # Staff can view and update quantities, but not delete
            if request.method in permissions.SAFE_METHODS:
                return True
            if request.method in ('PATCH', 'PUT'):
                return True
        return False


class CanManageMenu(permissions.BasePermission):
    """
    Permission for menu management operations.
    Only admins can create/update/delete menu items.
    Staff can only view.
    """
    message = 'Admin access required for menu management.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN':
            return True
        if request.user.role == 'STAFF' and request.method in permissions.SAFE_METHODS:
            return True
        return False


class CanManageOrders(permissions.BasePermission):
    """
    Permission for order operations.
    Staff can create orders and view their own.
    Admins can view all and update statuses.
    """
    message = 'Insufficient permissions for order operation.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True  # Object-level permissions handle the rest

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        if request.user.role == 'STAFF':
            # Staff can view orders they created
            if hasattr(obj, 'created_by') and obj.created_by == request.user:
                return True
            # Staff can create new orders (handled at view level)
            if request.method == 'POST':
                return True
        return False


class CanRecordPayment(permissions.BasePermission):
    """
    Permission for payment recording.
    Staff and admins can record payments.
    """
    message = 'Staff or admin access required for payment recording.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ('STAFF', 'ADMIN')