"""
Accounts view tests.
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import User, Role

User = get_user_model()


@pytest.mark.django_db
class TestUserViewSet:
    def setup_method(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='admin123', role=Role.ADMIN
        )
        self.staff_user = User.objects.create_user(
            username='staff', email='staff@test.com', password='staff123', role=Role.STAFF
        )

    def test_list_users_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/accounts/users/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 2

    def test_list_users_as_staff_forbidden(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get('/api/accounts/users/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_me(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get('/api/accounts/users/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'staff@test.com'

    def test_update_me(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.patch('/api/accounts/users/me/', {'first_name': 'Updated'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated'

    def test_change_password(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post('/api/accounts/users/change_password/', {
            'old_password': 'staff123',
            'new_password': 'newpass123',
            'new_password_confirm': 'newpass123',
        })
        assert response.status_code == status.HTTP_200_OK
        # Verify password changed
        self.staff_user.refresh_from_db()
        assert self.staff_user.check_password('newpass123')

    def test_get_roles(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get('/api/accounts/users/roles/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2


@pytest.mark.django_db
class TestTokenObtainPairView:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@test.com', password='testpass123'
        )

    def test_obtain_token_valid(self):
        response = self.client.post('/api/accounts/token/', {
            'email': 'test@test.com',
            'password': 'testpass123',
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data
        assert response.data['user']['email'] == 'test@test.com'

    def test_obtain_token_invalid(self):
        response = self.client.post('/api/accounts/token/', {
            'email': 'test@test.com',
            'password': 'wrongpass',
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED