"""
Accounts URLs - User authentication and profile endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomTokenObtainPairView,
    UserViewSet,
    UserProfileViewSet,
    password_reset_request,
    password_reset_confirm
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'profile', UserProfileViewSet, basename='profile')

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('password-reset/', password_reset_request, name='password_reset_request'),
    path('password-reset/confirm/', password_reset_confirm, name='password_reset_confirm'),
    path('', include(router.urls)),
]