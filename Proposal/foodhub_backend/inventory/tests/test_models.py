"""
Inventory model tests.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from inventory.models import Ingredient, StockMovement, IngredientCategory, UnitOfMeasure, DailyUsage, StockMovementReason, StockStatus
from accounts.models import Role

User = get_user_model()


class IngredientModelTest(TestCase):
    """Test cases for Ingredient model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role=Role.ADMIN
        )

    def test_create_ingredient(self):
        """Test creating an ingredient."""
        ingredient = Ingredient.objects.create(
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
        self.assertEqual(ingredient.name, 'Tomatoes')
        self.assertEqual(ingredient.category, IngredientCategory.VEGETABLES)
        self.assertEqual(ingredient.quantity, 10.5)
        self.assertEqual(ingredient.unit, UnitOfMeasure.KG)
        self.assertEqual(ingredient.reorder_level, 2.0)
        self.assertEqual(ingredient.unit_price, 50.00)
        self.assertEqual(ingredient.daily_usage, DailyUsage.HIGH)
        self.assertEqual(ingredient.description, 'Fresh tomatoes')
        self.assertEqual(ingredient.created_by, self.user)
        self.assertTrue(ingredient.is_active)

    def test_ingredient_str(self):
        """Test ingredient string representation."""
        ingredient = Ingredient.objects.create(
            name='Onions',
            category=IngredientCategory.VEGETABLES,
            quantity=5.0,
            unit=UnitOfMeasure.KG,
            created_by=self.user
        )
        self.assertEqual(str(ingredient), 'Onions (5.0 KG)')

    def test_ingredient_status_in_stock(self):
        """Test ingredient status when in stock."""
        ingredient = Ingredient.objects.create(
            name='Carrots',
            category=IngredientCategory.VEGETABLES,
            quantity=10.0,
            unit=UnitOfMeasure.KG,
            reorder_level=2.0,
            created_by=self.user
        )
        self.assertEqual(ingredient.status, StockStatus.IN_STOCK)

    def test_ingredient_status_low_stock(self):
        """Test ingredient status when low stock."""
        ingredient = Ingredient.objects.create(
            name='Potatoes',
            category=IngredientCategory.VEGETABLES,
            quantity=1.5,
            unit=UnitOfMeasure.KG,
            reorder_level=2.0,
            created_by=self.user
        )
        self.assertEqual(ingredient.status, StockStatus.LOW_STOCK)

    def test_ingredient_status_out_of_stock(self):
        """Test ingredient status when out of stock."""
        ingredient = Ingredient.objects.create(
            name='Lettuce',
            category=IngredientCategory.VEGETABLES,
            quantity=0,
            unit=UnitOfMeasure.KG,
            reorder_level=1.0,
            created_by=self.user
        )
        self.assertEqual(ingredient.status, StockStatus.OUT_OF_STOCK)

    def test_ingredient_total_value(self):
        """Test ingredient total value calculation."""
        ingredient = Ingredient.objects.create(
            name='Beef',
            category=IngredientCategory.MEAT,
            quantity=5.0,
            unit=UnitOfMeasure.KG,
            unit_price=200.00,
            created_by=self.user
        )
        self.assertEqual(ingredient.total_value, 1000.00)

    def test_ingredient_get_absolute_url(self):
        """Test ingredient get_absolute_url method."""
        ingredient = Ingredient.objects.create(
            name='Chicken',
            category=IngredientCategory.MEAT,
            quantity=3.0,
            unit=UnitOfMeasure.KG,
            created_by=self.user
        )
        expected_url = f'/api/inventory/ingredients/{ingredient.id}/'
        self.assertEqual(ingredient.get_absolute_url(), expected_url)


class StockMovementModelTest(TestCase):
    """Test cases for StockMovement model."""

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

    def test_create_stock_movement(self):
        """Test creating a stock movement."""
        movement = StockMovement.objects.create(
            ingredient=self.ingredient,
            quantity_before=20.0,
            quantity_change=5.0,
            quantity_after=25.0,
            reason=StockMovementReason.RESTOCK,
            reference_id='PO-001',
            notes='New delivery received',
            created_by=self.user
        )
        self.assertEqual(movement.ingredient, self.ingredient)
        self.assertEqual(movement.quantity_before, 20.0)
        self.assertEqual(movement.quantity_change, 5.0)
        self.assertEqual(movement.quantity_after, 25.0)
        self.assertEqual(movement.reason, StockMovementReason.RESTOCK)
        self.assertEqual(movement.reference_id, 'PO-001')
        self.assertEqual(movement.notes, 'New delivery received')
        self.assertEqual(movement.created_by, self.user)

    def test_stock_movement_str(self):
        """Test stock movement string representation."""
        movement = StockMovement.objects.create(
            ingredient=self.ingredient,
            quantity_before=20.0,
            quantity_change=-2.0,
            quantity_after=18.0,
            reason=StockMovementReason.ORDER_DEDUCTION,
            created_by=self.user
        )
        expected = f'{self.ingredient.name}: -2.0 {self.ingredient.unit} (Order Deduction)'
        self.assertEqual(str(movement), expected)

    def test_stock_movement_reasons_choices(self):
        """Test that all stock movement reasons are available."""
        reasons = [r.value for r in StockMovementReason]
        expected = ['ORDER_DEDUCTION', 'RESTOCK', 'WASTE', 'ADJUSTMENT', 'RETURN', 'INITIAL']
        self.assertEqual(sorted(reasons), sorted(expected))

    def test_ingredient_categories_choices(self):
        """Test that all ingredient categories are available."""
        categories = [c.value for c in IngredientCategory]
        expected = ['MEAT', 'VEGETABLES', 'CONDIMENTS', 'SAUCES', 'SPICES', 'DAIRY', 'POULTRY', 'BEVERAGES', 'OTHERS']
        self.assertEqual(sorted(categories), sorted(expected))

    def test_units_of_measure_choices(self):
        """Test that all units of measure are available."""
        units = [u.value for u in UnitOfMeasure]
        expected = ['KG', 'G', 'L', 'ML', 'PCS', 'CANS', 'PACKS']
        self.assertEqual(sorted(units), sorted(expected))

    def test_daily_usage_choices(self):
        """Test that all daily usage levels are available."""
        usages = [d.value for d in DailyUsage]
        expected = ['LOW', 'MEDIUM', 'HIGH']
        self.assertEqual(sorted(usages), sorted(expected))

    def test_stock_status_choices(self):
        """Test that all stock statuses are available."""
        statuses = [s.value for s in StockStatus]
        expected = ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']
        self.assertEqual(sorted(statuses), sorted(expected))