"""
Settings URLs - User settings and backup endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserSettingsViewSet, SystemBackupViewSet

router = DefaultRouter()
router.register(r'', UserSettingsViewSet, basename='settings')

urlpatterns = [
    path('', include(router.urls)),
    path('system-backup/', SystemBackupViewSet.as_view({'post': 'create'}), name='system-backup'),
]