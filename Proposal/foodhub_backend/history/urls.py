"""History URLs - activity audit endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ActivityLogViewSet

router = DefaultRouter()
router.register(r'logs', ActivityLogViewSet, basename='activity-log')

urlpatterns = [
    path('', include(router.urls)),
]
