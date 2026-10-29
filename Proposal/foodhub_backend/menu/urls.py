"""
Menu URLs - API endpoints for menu categories and items.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MenuCategoryViewSet, MenuItemViewSet

router = DefaultRouter()
router.register(r'categories', MenuCategoryViewSet, basename='menu-category')
router.register(r'menu-items', MenuItemViewSet, basename='menu-item')

urlpatterns = [
    path('', include(router.urls)),
]