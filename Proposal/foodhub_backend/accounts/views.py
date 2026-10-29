"""
Accounts views - User authentication, profile management, and role-based access.
"""
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import User, UserProfile, Role
from .serializers import (
    UserSerializer, UserCreateSerializer, UserProfileSerializer,
    ChangePasswordSerializer, RoleSerializer
)
from core.permissions import IsAdminUser

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view that includes user data in response.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Add user data to response
            user = User.objects.get(email=request.data.get('email'))
            user_data = UserSerializer(user).data
            response.data['user'] = user_data
        return response


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management.
    Admins can manage all users. Users can view/update their own profile.
    """
    queryset = User.objects.select_related('profile').all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'list']:
            return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == Role.ADMIN:
            return User.objects.select_related('profile').all()
        # Staff can only see themselves
        return User.objects.filter(id=user.id).select_related('profile')

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Get or update current user's profile."""
        user = request.user
        if request.method == 'GET':
            serializer = UserSerializer(user)
            return Response(serializer.data)
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change current user's password."""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password changed successfully.'})

    @action(detail=False, methods=['get'])
    def roles(self, request):
        """Get available roles."""
        roles = [{'value': role.value, 'label': role.label} for role in Role]
        return Response(roles)


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user profile management.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile