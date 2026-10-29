"""
Inventory URLs - Ingredient and stock movement endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, StockMovementViewSet

router = DefaultRouter()
router.register(r'ingredients', IngredientViewSet, basename='ingredient')
router.register(r'movements', StockMovementViewSet, basename='stockmovement')

urlpatterns = [
    path('', include(router.urls)),
]