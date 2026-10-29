"""
Inventory view tests.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from inventory.models import Ingredient, StockMovement, IngredientCategory, UnitOfMeasure, DailyUsage, StockMovementReason
from accounts.models import Role

User = get_user_model()


class IngredientViewSetTest(TestCase):
    """Test cases for IngredientViewSet."""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role=Role.ADMIN
        )
        self.staff_user = User.objects.create_user(
            username='staff',
            email='staff@example.com',
            password='staffpass123',
            role=Role.STAFF
        )
        self.client = APIClient()
        self.ingredient = Ingredient.objects.create(
            name='Tomatoes',
            category=IngredientCategory.VEGETABLES,
            quantity=10.5,
            unit=UnitOfMeasure.KG,
            reorder_level=2.0,
            unit_price=50.00,
            daily_usage=DailyUsage.HIGH,
            description='Fresh tomatoes',
            created_by=self.admin_user
        )

    def authenticate(self, user):
        """Helper to authenticate a user."""
        self.client.force_authenticate(user=user)

    def test_list_ingredients_unauthenticated(self):
        """Test that unauthenticated users cannot list ingredients."""
        response = self.client.get('/api/inventory/ingredients/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_ingredients_admin(self):
        """Test admin can list ingredients."""
        self.authenticate(self.admin_user)
        response = self.client.get('/api/inventory/ingredients/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_ingredients_staff(self):
        """Test staff can list ingredients."""
        self.authenticate(self.staff_user)
        response = self.client.get('/api/inventory/ingredients/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_retrieve_ingredient(self):
        """Test retrieving a single ingredient."""
        self.authenticate(self.staff_user)
        response = self.client.get(f'/api/inventory/ingredients/{self.ingredient.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Tomatoes')

    def test_create_ingredient_admin(self):
        """Test admin can create ingredient."""
        self.authenticate(self.admin_user)
        data = {
            'name': 'Onions',
            'category': IngredientCategory.VEGETABLES,
            'quantity': 5.0,
            'unit': UnitOfMeasure.KG,
            'reorder_level': 1.0,
            'unit_price': 30.00,
            'daily_usage': DailyUsage.MEDIUM,
            'description': 'Yellow onions',
            'is_active': True
        }
        response = self.client.post('/api/inventory/ingredients/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Onions')
        self.assertTrue(Ingredient.objects.filter(name='Onions').exists())

    def test_create_ingredient_staff_forbidden(self):
        """Test staff cannot create ingredient."""
        self.authenticate(self.staff_user)
        data = {
            'name': 'Onions',
            'category': IngredientCategory.VEGETABLES,
            'quantity': 5.0,
            'unit': UnitOfMeasure.KG,
            'reorder_level': 1.0,
            'unit_price': 30.00,
            'daily_usage': DailyUsage.MEDIUM,
        }
        response = self.client.post('/api/inventory/ingredients/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_ingredient_admin(self):
        """Test admin can update ingredient."""
        self.authenticate(self.admin_user)
        data = {'quantity': 15.0, 'reorder_level': 3.0}
        response = self.client.patch(f'/api/inventory/ingredients/{self.ingredient.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.quantity, 15.0)
        self.assertEqual(self.ingredient.reorder_level, 3.0)

    def test_update_ingredient_staff(self):
        """Test staff can update ingredient quantity."""
        self.authenticate(self.staff_user)
        data = {'quantity': 12.0}
        response = self.client.patch(f'/api/inventory/ingredients/{self.ingredient.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.quantity, 12.0)

    def test_delete_ingredient_admin(self):
        """Test admin can delete ingredient."""
        self.authenticate(self.admin_user)
        response = self.client.delete(f'/api/inventory/ingredients/{self.ingredient.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Ingredient.objects.filter(id=self.ingredient.id).exists())

    def test_delete_ingredient_staff_forbidden(self):
        """Test staff cannot delete ingredient."""
        self.authenticate(self.staff_user)
        response = self.client.delete(f'/api/inventory/ingredients/{self.ingredient.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_adjust_stock(self):
        """Test adjust stock action."""
        self.authenticate(self.staff_user)
        data = {
            'quantity_change': 5.0,
            'reason': StockMovementReason.RESTOCK,
            'reference_id': 'PO-001',
            'notes': 'New delivery'
        }
        response = self.client.post(
            f'/api/inventory/ingredients/{self.ingredient.id}/adjust_stock/',
            data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.quantity, 15.5)
        # Check stock movement was created
        self.assertTrue(StockMovement.objects.filter(
            ingredient=self.ingredient,
            reason=StockMovementReason.RESTOCK
        ).exists())

    def test_adjust_stock_insufficient(self):
        """Test adjust stock with insufficient quantity."""
        self.authenticate(self.staff_user)
        data = {
            'quantity_change': -20.0,  # More than available
            'reason': StockMovementReason.ORDER_DEDUCTION,
        }
        response = self.client.post(
            f'/api/inventory/ingredients/{self.ingredient.id}/adjust_stock/',
            data
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.quantity, 10.5)  # Unchanged

    def test_adjust_stock_invalid_reason(self):
        """Test adjust stock with invalid reason."""
        self.authenticate(self.staff_user)
        data = {
            'quantity_change': 5.0,
            'reason': 'INVALID_REASON',
        }
        response = self.client.post(
            f'/api/inventory/ingredients/{self.ingredient.id}/adjust_stock/',
            data
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_low_stock_endpoint(self):
        """Test low stock endpoint."""
        # Create a low stock ingredient
        low_ingredient = Ingredient.objects.create(
            name='Lettuce',
            category=IngredientCategory.VEGETABLES,
            quantity=0.5,
            unit=UnitOfMeasure.KG,
            reorder_level=1.0,
            created_by=self.admin_user
        )
        # Create out of stock ingredient
        out_ingredient = Ingredient.objects.create(
            name='Spinach',
            category=IngredientCategory.VEGETABLES,
            quantity=0,
            unit=UnitOfMeasure.KG,
            reorder_level=1.0,
            created_by=self.admin_user
        )
        self.authenticate(self.staff_user)
        response = self.client.get('/api/inventory/ingredients/low_stock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['out_of_stock']), 1)
        self.assertEqual(len(response.data['low_stock']), 1)

    def test_categories_endpoint(self):
        """Test categories endpoint."""
        self.authenticate(self.staff_user)
        response = self.client.get('/api/inventory/ingredients/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

    def test_units_endpoint(self):
        """Test units endpoint."""
        self.authenticate(self.staff_user)
        response = self.client.get('/api/inventory/ingredients/units/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

    def test_daily_usage_levels_endpoint(self):
        """Test daily usage levels endpoint."""
        self.authenticate(self.staff_user)
        response = self.client.get('/api/inventory/ingredients/daily_usage_levels/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

    def test_summary_endpoint(self):
        """Test summary endpoint."""
        self.authenticate(self.staff_user)
        response = self.client.get('/api/inventory/ingredients/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_items', response.data)
        self.assertIn('in_stock', response.data)
        self.assertIn('low_stock', response.data)
        self.assertIn('out_of_stock', response.data)
        self.assertIn('total_value', response.data)


class StockMovementViewSetTest(TestCase):
    """Test cases for StockMovementViewSet."""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin2',
            email='admin2@example.com',
            password='adminpass123',
            role=Role.ADMIN
        )
        self.staff_user = User.objects.create_user(
            username='staff2',
            email='staff2@example.com',
            password='staffpass123',
            role=Role.STAFF
        )
        self.client = APIClient()
        self.ingredient = Ingredient.objects.create(
            name='Rice',
            category=IngredientCategory.OTHERS,
            quantity=20.0,
            unit=UnitOfMeasure.KG,
            created_by=self.admin_user
        )
        self.movement = StockMovement.objects.create(
            ingredient=self.ingredient,
            quantity_before=20.0,
            quantity_change=5.0,
            quantity_after=25.0,
            reason=StockMovementReason.RESTOCK,
            reference_id='PO-001',
            notes='New delivery',
            created_by=self.admin_user
        )

    def authenticate(self, user):
        """Helper to authenticate a user."""
        self.client.force_authenticate(user=user)

    def test_list_movements(self):
        """Test listing stock movements."""
        self.authenticate(self.staff_user)
        response = self.client.get('/api/inventory/movements/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_retrieve_movement(self):
        """Test retrieving a single stock movement."""
        self.authenticate(self.staff_user)
        response = self.client.get(f'/api/inventory/movements/{self.movement.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.movement.id)

    def test_movements_read_only(self):
        """Test that stock movements are read-only."""
        self.authenticate(self.admin_user)
        data = {
            'ingredient': self.ingredient.id,
            'quantity_before': 25.0,
            'quantity_change': -2.0,
            'quantity_after': 23.0,
            'reason': StockMovementReason.ORDER_DEDUCTION,
        }
        response = self.client.post('/api/inventory/movements/', data)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_reasons_endpoint(self):
        """Test reasons endpoint."""
        self.authenticate(self.staff_user)
        response = self.client.get('/api/inventory/movements/reasons/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)