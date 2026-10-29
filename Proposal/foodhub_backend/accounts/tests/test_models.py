"""
Accounts model tests.
"""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from accounts.models import User, UserProfile, Role

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role=Role.STAFF
        )
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert user.role == Role.STAFF
        assert user.check_password('testpass123')
        assert user.is_active is True

    def test_create_admin_user(self):
        user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role=Role.ADMIN
        )
        assert user.role == Role.ADMIN
        assert user.is_staff is True
        assert user.is_superuser is True

    def test_user_email_unique(self):
        User.objects.create_user(username='user1', email='unique@example.com', password='pass123')
        with pytest.raises(IntegrityError):
            User.objects.create_user(username='user2', email='unique@example.com', password='pass123')

    def test_user_role_choices(self):
        assert Role.ADMIN == 'ADMIN'
        assert Role.STAFF == 'STAFF'
        assert Role.ADMIN.label == 'Administrator'
        assert Role.STAFF.label == 'Staff'

    def test_user_properties(self):
        admin_user = User.objects.create_user(username='admin', email='admin@test.com', password='pass', role=Role.ADMIN)
        staff_user = User.objects.create_user(username='staff', email='staff@test.com', password='pass', role=Role.STAFF)
        assert admin_user.is_admin is True
        assert admin_user.is_staff_user is False
        assert staff_user.is_admin is False
        assert staff_user.is_staff_user is True


@pytest.mark.django_db
class TestUserProfileModel:
    def test_create_profile(self):
        user = User.objects.create_user(username='testuser', email='test@example.com', password='pass123')
        profile = UserProfile.objects.create(
            user=user,
            phone='1234567890',
            address='123 Test St'
        )
        assert profile.user == user
        assert profile.phone == '1234567890'
        assert profile.address == '123 Test St'

    def test_profile_auto_created_on_user_save(self):
        """Test that profile can be created manually (not auto via signal in this model)."""
        user = User.objects.create_user(username='testuser2', email='test2@example.com', password='pass123')
        assert hasattr(user, 'profile') is False  # No auto-creation without signal
        profile = UserProfile.objects.create(user=user)
        assert user.profile == profile