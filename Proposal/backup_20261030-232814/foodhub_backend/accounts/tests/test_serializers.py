"""
Accounts serializer tests.
"""
import pytest
from django.contrib.auth import get_user_model
from accounts.models import User, UserProfile, Role
from accounts.serializers import (
    UserSerializer, UserCreateSerializer, UserProfileSerializer,
    ChangePasswordSerializer, RoleSerializer
)

User = get_user_model()


@pytest.mark.django_db
class TestUserSerializer:
    def test_user_serializer(self):
        user = User.objects.create_user(username='testuser', email='test@example.com', password='pass123', role=Role.STAFF)
        serializer = UserSerializer(user)
        data = serializer.data
        assert data['username'] == 'testuser'
        assert data['email'] == 'test@example.com'
        assert data['role'] == Role.STAFF
        assert data['role_display'] == 'Staff'

    def test_user_serializer_with_profile(self):
        user = User.objects.create_user(username='testuser', email='test@example.com', password='pass123')
        UserProfile.objects.create(user=user, phone='1234567890', address='123 Test St')
        serializer = UserSerializer(user)
        data = serializer.data
        assert data['profile']['phone'] == '1234567890'
        assert data['profile']['address'] == '123 Test St'


@pytest.mark.django_db
class TestUserCreateSerializer:
    def test_create_user_valid(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'securepass123',
            'password_confirm': 'securepass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': Role.STAFF,
        }
        serializer = UserCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        assert user.username == 'newuser'
        assert user.email == 'new@example.com'
        assert user.check_password('securepass123')
        assert user.role == Role.STAFF

    def test_create_user_password_mismatch(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'securepass123',
            'password_confirm': 'differentpass',
        }
        serializer = UserCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password_confirm' in serializer.errors

    def test_create_user_duplicate_email(self):
        User.objects.create_user(username='existing', email='dup@example.com', password='pass123')
        data = {
            'username': 'newuser',
            'email': 'dup@example.com',
            'password': 'securepass123',
            'password_confirm': 'securepass123',
        }
        serializer = UserCreateSerializer(data=data)
        assert not serializer.is_valid()


@pytest.mark.django_db
class TestUserProfileSerializer:
    def test_profile_serializer(self):
        user = User.objects.create_user(username='testuser', email='test@example.com', password='pass123')
        profile = UserProfile.objects.create(user=user, phone='1234567890', address='123 Test St')
        serializer = UserProfileSerializer(profile)
        data = serializer.data
        assert data['phone'] == '1234567890'
        assert data['address'] == '123 Test St'


@pytest.mark.django_db
class TestChangePasswordSerializer:
    def test_change_password_valid(self):
        user = User.objects.create_user(username='testuser', email='test@example.com', password='oldpass123')
        serializer = ChangePasswordSerializer(
            data={
                'old_password': 'oldpass123',
                'new_password': 'newpass123',
                'new_password_confirm': 'newpass123',
            },
            context={'request': type('Request', (), {'user': user})()}
        )
        assert serializer.is_valid(), serializer.errors
        serializer.save()
        user.refresh_from_db()
        assert user.check_password('newpass123')

    def test_change_password_wrong_old(self):
        user = User.objects.create_user(username='testuser', email='test@example.com', password='oldpass123')
        serializer = ChangePasswordSerializer(
            data={
                'old_password': 'wrongpass',
                'new_password': 'newpass123',
                'new_password_confirm': 'newpass123',
            },
            context={'request': type('Request', (), {'user': user})()}
        )
        assert not serializer.is_valid()
        assert 'old_password' in serializer.errors

    def test_change_password_mismatch(self):
        user = User.objects.create_user(username='testuser', email='test@example.com', password='oldpass123')
        serializer = ChangePasswordSerializer(
            data={
                'old_password': 'oldpass123',
                'new_password': 'newpass123',
                'new_password_confirm': 'different',
            },
            context={'request': type('Request', (), {'user': user})()}
        )
        assert not serializer.is_valid()
        assert 'new_password_confirm' in serializer.errors


@pytest.mark.django_db
class TestRoleSerializer:
    def test_role_serializer(self):
        roles = RoleSerializer(Role.choices, many=True)
        data = roles.data
        assert len(data) == 2
        assert data[0]['value'] == 'ADMIN'
        assert data[0]['label'] == 'Administrator'
        assert data[1]['value'] == 'STAFF'
        assert data[1]['label'] == 'Staff'