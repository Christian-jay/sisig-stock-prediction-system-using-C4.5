"""
Inventory serializer tests.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from inventory.models import Ingredient, StockMovement, IngredientCategory, UnitOfMeasure, DailyUsage, StockMovementReason
from inventory.serializers import (
    IngredientSerializer, IngredientCreateSerializer, IngredientUpdateSerializer,
    StockMovementSerializer, StockMovementCreateSerializer
)
from accounts.models import Role

User = get_user_model()


class IngredientSerializerTest(TestCase):
    """Test cases for Ingredient serializers."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role=Role.ADMIN
        )
        self.ingredient = Ingredient.objects.create(
            name='Tomatoes',
            category=IngredientCategory.VEGETABLES,
            quantity=10.5,
            unit=UnitOfMeasure.KG,
            reorder_level=2.0,
            unit_price=50.00,
            daily_usage=DailyUsage.HIGH,
            description='Fresh tomatoes',
            created_by=self.user
        )

    def test_ingredient_serializer_output(self):
        """Test IngredientSerializer output."""
        serializer = IngredientSerializer(self.ingredient)
        data = serializer.data
        self.assertEqual(data['name'], 'Tomatoes')
        self.assertEqual(data['category'], IngredientCategory.VEGETABLES)
        self.assertEqual(data['category_display'], 'Vegetables')
        self.assertEqual(float(data['quantity']), 10.5)
        self.assertEqual(data['unit'], UnitOfMeasure.KG)
        self.assertEqual(data['unit_display'], 'Kilogram')
        self.assertEqual(float(data['reorder_level']), 2.0)
        self.assertEqual(float(data['unit_price']), 50.00)
        self.assertEqual(data['daily_usage'], DailyUsage.HIGH)
        self.assertEqual(data['daily_usage_display'], 'High')
        self.assertEqual(data['description'], 'Fresh tomatoes')
        self.assertTrue(data['is_active'])
        self.assertEqual(data['status'], 'IN_STOCK')
        self.assertEqual(data['status_display'], 'In Stock')
        self.assertEqual(float(data['total_value']), 525.00)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)
        self.assertEqual(data['created_by'], self.user.id)
        self.assertEqual(data['created_by_name'], '')
        self.assertIn('recent_movements', data)

    def test_ingredient_create_serializer_valid(self):
        """Test IngredientCreateSerializer with valid data."""
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
        serializer = IngredientCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        ingredient = serializer.save(created_by=self.user)
        self.assertEqual(ingredient.name, 'Onions')
        self.assertEqual(ingredient.created_by, self.user)

    def test_ingredient_create_serializer_invalid_negative_quantity(self):
        """Test IngredientCreateSerializer rejects negative quantity."""
        data = {
            'name': 'Invalid',
            'category': IngredientCategory.VEGETABLES,
            'quantity': -1.0,
            'unit': UnitOfMeasure.KG,
            'reorder_level': 1.0,
            'unit_price': 10.00,
            'daily_usage': DailyUsage.LOW,
        }
        serializer = IngredientCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)

    def test_ingredient_create_serializer_invalid_negative_reorder_level(self):
        """Test IngredientCreateSerializer rejects negative reorder level."""
        data = {
            'name': 'Invalid',
            'category': IngredientCategory.VEGETABLES,
            'quantity': 5.0,
            'unit': UnitOfMeasure.KG,
            'reorder_level': -1.0,
            'unit_price': 10.00,
            'daily_usage': DailyUsage.LOW,
        }
        serializer = IngredientCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('reorder_level', serializer.errors)

    def test_ingredient_update_serializer(self):
        """Test IngredientUpdateSerializer."""
        data = {
            'name': 'Tomatoes Updated',
            'quantity': 15.0,
            'reorder_level': 3.0,
            'is_active': False
        }
        serializer = IngredientUpdateSerializer(self.ingredient, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        self.assertEqual(updated.name, 'Tomatoes Updated')
        self.assertEqual(updated.quantity, 15.0)
        self.assertEqual(updated.reorder_level, 3.0)
        self.assertFalse(updated.is_active)


class StockMovementSerializerTest(TestCase):
    """Test cases for StockMovement serializers."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123',
            role=Role.STAFF
        )
        self.ingredient = Ingredient.objects.create(
            name='Rice',
            category=IngredientCategory.OTHERS,
            quantity=20.0,
            unit=UnitOfMeasure.KG,
            created_by=self.user
        )
        self.movement = StockMovement.objects.create(
            ingredient=self.ingredient,
            quantity_before=20.0,
            quantity_change=5.0,
            quantity_after=25.0,
            reason=StockMovementReason.RESTOCK,
            reference_id='PO-001',
            notes='New delivery',
            created_by=self.user
        )

    def test_stock_movement_serializer_output(self):
        """Test StockMovementSerializer output."""
        serializer = StockMovementSerializer(self.movement)
        data = serializer.data
        self.assertEqual(data['id'], self.movement.id)
        self.assertEqual(data['ingredient'], self.ingredient.id)
        self.assertEqual(data['ingredient_name'], 'Rice')
        self.assertEqual(data['ingredient_unit'], 'KG')
        self.assertEqual(float(data['quantity_before']), 20.0)
        self.assertEqual(float(data['quantity_change']), 5.0)
        self.assertEqual(float(data['quantity_after']), 25.0)
        self.assertEqual(data['reason'], StockMovementReason.RESTOCK)
        self.assertEqual(data['reason_display'], 'Restock')
        self.assertEqual(data['reference_id'], 'PO-001')
        self.assertEqual(data['notes'], 'New delivery')
        self.assertEqual(data['created_by'], self.user.id)
        self.assertIn('created_at', data)

    def test_stock_movement_create_serializer(self):
        """Test StockMovementCreateSerializer."""
        data = {
            'ingredient': self.ingredient.id,
            'quantity_before': 25.0,
            'quantity_change': -2.0,
            'quantity_after': 23.0,
            'reason': StockMovementReason.ORDER_DEDUCTION,
            'reference_id': 'ORDER-001',
            'notes': 'Used for cooking'
        }
        serializer = StockMovementCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())