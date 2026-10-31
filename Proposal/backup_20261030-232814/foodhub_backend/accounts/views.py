"""
Accounts views - User authentication, profile management, and role-based access.
"""
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from .models import User, UserProfile, Role
from .serializers import (
    UserSerializer, UserCreateSerializer, UserProfileSerializer,
    ChangePasswordSerializer, RoleSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, CustomTokenObtainPairSerializer
)
from core.permissions import IsAdminUser

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view using CustomTokenObtainPairSerializer
    which includes user role in token payload and user data in response.
    """
    serializer_class = CustomTokenObtainPairSerializer


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


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """
    Request a password reset email.
    Always returns success for security (don't reveal if email exists).
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']

    # Find user by email (case-insensitive)
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        # Always return success for security - don't reveal if email exists
        return Response({
            'detail': 'If an account exists with that email, a password reset link has been sent.'
        })

    # Generate password reset token
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    # Build reset URL (frontend will handle this)
    # In production, use settings.FRONTEND_URL or similar
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:8000,http://192.168.1.6:8080')
    reset_url = f"{frontend_url}/reset-password.html?token={token}&uid={uid}"

    # Send email
    try:
        send_mail(
            subject='FOODHUB — Password Reset Request',
            message=f'''
Hello {user.first_name or user.username},

You requested a password reset for your FOODHUB account.

Click the link below to reset your password:
{reset_url}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
The FOODHUB Team
            '''.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@foodhub.local',
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        # Log error but don't reveal to user
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send password reset email to {user.email}: {e}")

        # Still return success for security
        pass

    return Response({
        'detail': 'If an account exists with that email, a password reset link has been sent.'
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """
    Confirm password reset with token and set new password.
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    token = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']
    uid = serializer.validated_data.get('uid')

    # Decode user ID from uid if provided
    if uid:
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {'detail': 'Invalid reset link.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        # If no uid, we need to find user by token (less secure, but works)
        # This is a fallback - normally uid should be provided
        return Response(
            {'detail': 'Invalid reset link. Missing user identifier.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Verify token
    if not default_token_generator.check_token(user, token):
        return Response(
            {'detail': 'Invalid or expired reset token.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set new password
    user.set_password(new_password)
    user.save()

    # Invalidate all existing tokens for this user (optional but recommended)
    # This would require token blacklist app

    return Response({
        'detail': 'Password has been reset successfully.'
    })