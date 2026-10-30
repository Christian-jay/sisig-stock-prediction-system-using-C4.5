"""
Menu views - API endpoints for menu categories and items.
"""
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, SAFE_METHODS
from django.db.models import Q

from .models import MenuCategory, MenuItem
from .serializers import (
    MenuCategorySerializer, MenuItemSerializer, MenuItemSimpleSerializer
)
from core.permissions import CanManageMenu


class MenuCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for menu category management.
    """
    queryset = MenuCategory.objects.all()
    serializer_class = MenuCategorySerializer
    permission_classes = [CanManageMenu]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['display_order', 'name']
    ordering = ['display_order', 'name']

    def get_queryset(self):
        qs = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs


class MenuItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for menu item management.
    """
    queryset = MenuItem.objects.select_related('category').prefetch_related('recipe_ingredients__ingredient').all()
    permission_classes = [CanManageMenu]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['category__display_order', 'display_order', 'name', 'price']
    ordering = ['category__display_order', 'display_order', 'name']

    def get_serializer_class(self):
        if self.action == 'list':
            return MenuItemSimpleSerializer
        return MenuItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        # Filter by item_type
        item_type = self.request.query_params.get('item_type')
        if item_type:
            qs = qs.filter(item_type=item_type.upper())
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        # Only available items for order creation
        available_only = self.request.query_params.get('available_only')
        if available_only and available_only.lower() == 'true':
            qs = qs.filter(is_active=True, status=MenuItem.Status.AVAILABLE)
        return qs

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available menu items for order creation."""
        items = self.get_queryset().filter(
            is_active=True,
            status=MenuItem.Status.AVAILABLE
        )
        serializer = MenuItemSimpleSerializer(items, many=True)
        return Response(serializer.data)