"""
Management command to populate sample data for testing.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from inventory.models import Ingredient, StockMovement, StockMovementReason
from menu.models import MenuCategory, MenuItem, RecipeIngredient
from accounts.models import User, Role

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate database with sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')

        # Get admin user
        admin_user = User.objects.filter(email='admin@foodhub.com').first()
        if not admin_user:
            admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Admin user not found!'))
            return
        self.stdout.write(f'Using admin user: {admin_user.email}')

        # Create Menu Categories
        categories_data = [
            {'name': 'Sisig Specials', 'description': 'Our signature sisig dishes', 'display_order': 1},
            {'name': 'Rice Meals', 'description': 'Complete rice meals with viand', 'display_order': 2},
            {'name': 'Appetizers', 'description': 'Starters and side dishes', 'display_order': 3},
            {'name': 'Beverages', 'description': 'Drinks and refreshments', 'display_order': 4},
            {'name': 'Desserts', 'description': 'Sweet treats', 'display_order': 5},
        ]

        categories = {}
        for cat_data in categories_data:
            cat, created = MenuCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'display_order': cat_data['display_order'],
                    'is_active': True,
                    'created_by': admin_user,
                }
            )
            categories[cat_data['name']] = cat
            if created:
                self.stdout.write(f'Created category: {cat.name}')

        # Get existing ingredients for recipe linking
        ingredients = list(Ingredient.objects.filter(is_active=True))
        if not ingredients:
            self.stdout.write(self.style.ERROR('No ingredients found! Please add ingredients first.'))
            return

        # Create Menu Items with images from picsum.photos
        menu_items_data = [
            # Sisig Specials
            {
                'name': 'Sisig Burger',
                'description': 'Crispy sisig patty with mayo, lettuce, and tomato in a toasted bun',
                'category': 'Sisig Specials',
                'item_type': 'FOOD',
                'price': Decimal('85.00'),
                'cost_price': Decimal('35.00'),
                'preparation_time': 10,
                'calories': 450,
                'is_vegetarian': False,
                'image_id': '237',  # picsum photo ID
            },
            {
                'name': 'Sisig Meal',
                'description': 'Sizzling sisig with garlic rice and sunny side up egg',
                'category': 'Sisig Specials',
                'item_type': 'FOOD',
                'price': Decimal('120.00'),
                'cost_price': Decimal('50.00'),
                'preparation_time': 15,
                'calories': 650,
                'is_vegetarian': False,
                'image_id': '238',
            },
            {
                'name': 'Sisig Sizzler',
                'description': 'Hot plate sisig with onions, chili, and calamansi',
                'category': 'Sisig Specials',
                'item_type': 'FOOD',
                'price': Decimal('150.00'),
                'cost_price': Decimal('65.00'),
                'preparation_time': 12,
                'calories': 580,
                'is_vegetarian': False,
                'image_id': '239',
            },
            {
                'name': 'Sisig (Solo)',
                'description': 'Single serving of our classic pork sisig',
                'category': 'Sisig Specials',
                'item_type': 'FOOD',
                'price': Decimal('95.00'),
                'cost_price': Decimal('40.00'),
                'preparation_time': 8,
                'calories': 400,
                'is_vegetarian': False,
                'image_id': '240',
            },
            {
                'name': 'Sisig Family Pack',
                'description': 'Large serving of sisig good for 3-4 persons',
                'category': 'Sisig Specials',
                'item_type': 'COMBO',
                'price': Decimal('350.00'),
                'cost_price': Decimal('150.00'),
                'preparation_time': 20,
                'calories': 1200,
                'is_vegetarian': False,
                'image_id': '241',
            },
            # Rice Meals
            {
                'name': 'Chicken Sisig Rice Bowl',
                'description': 'Chicken sisig with garlic rice and egg',
                'category': 'Rice Meals',
                'item_type': 'FOOD',
                'price': Decimal('99.00'),
                'cost_price': Decimal('42.00'),
                'preparation_time': 12,
                'calories': 600,
                'is_vegetarian': False,
                'image_id': '242',
            },
            {
                'name': 'Bangus Sisig Meal',
                'description': 'Boneless bangus sisig with rice and egg',
                'category': 'Rice Meals',
                'item_type': 'FOOD',
                'price': Decimal('110.00'),
                'cost_price': Decimal('48.00'),
                'preparation_time': 15,
                'calories': 550,
                'is_vegetarian': False,
                'image_id': '243',
            },
            {
                'name': 'Tofu Sisig (Vegetarian)',
                'description': 'Crispy tofu sisig with vegetables and rice',
                'category': 'Rice Meals',
                'item_type': 'FOOD',
                'price': Decimal('85.00'),
                'cost_price': Decimal('35.00'),
                'preparation_time': 10,
                'calories': 400,
                'is_vegetarian': True,
                'image_id': '244',
            },
            # Appetizers
            {
                'name': 'Sisig Nachos',
                'description': 'Tortilla chips topped with sisig, cheese, and jalapenos',
                'category': 'Appetizers',
                'item_type': 'FOOD',
                'price': Decimal('120.00'),
                'cost_price': Decimal('50.00'),
                'preparation_time': 8,
                'calories': 500,
                'is_vegetarian': False,
                'image_id': '245',
            },
            {
                'name': 'Lumpia Shanghai',
                'description': 'Crispy pork spring rolls with sweet chili sauce',
                'category': 'Appetizers',
                'item_type': 'FOOD',
                'price': Decimal('65.00'),
                'cost_price': Decimal('25.00'),
                'preparation_time': 10,
                'calories': 300,
                'is_vegetarian': False,
                'image_id': '246',
            },
            {
                'name': 'Chicharon Bulaklak',
                'description': 'Deep-fried pork intestines with vinegar dip',
                'category': 'Appetizers',
                'item_type': 'FOOD',
                'price': Decimal('130.00'),
                'cost_price': Decimal('55.00'),
                'preparation_time': 15,
                'calories': 450,
                'is_vegetarian': False,
                'image_id': '247',
            },
            # Beverages
            {
                'name': 'Iced Tea',
                'description': 'Refreshing house-blend iced tea',
                'category': 'Beverages',
                'item_type': 'DRINK',
                'price': Decimal('25.00'),
                'cost_price': Decimal('8.00'),
                'preparation_time': 2,
                'calories': 80,
                'is_vegetarian': True,
                'image_id': '248',
            },
            {
                'name': 'Soda (Coke/Sprite/Royal)',
                'description': 'Assorted soft drinks',
                'category': 'Beverages',
                'item_type': 'DRINK',
                'price': Decimal('30.00'),
                'cost_price': Decimal('12.00'),
                'preparation_time': 1,
                'calories': 140,
                'is_vegetarian': True,
                'image_id': '249',
            },
            {
                'name': 'Buko Juice',
                'description': 'Fresh young coconut juice with meat',
                'category': 'Beverages',
                'item_type': 'DRINK',
                'price': Decimal('45.00'),
                'cost_price': Decimal('20.00'),
                'preparation_time': 3,
                'calories': 100,
                'is_vegetarian': True,
                'is_vegan': True,
                'image_id': '250',
            },
            # Desserts
            {
                'name': 'Leche Flan',
                'description': 'Classic Filipino caramel custard',
                'category': 'Desserts',
                'item_type': 'DESSERT',
                'price': Decimal('45.00'),
                'cost_price': Decimal('18.00'),
                'preparation_time': 5,
                'calories': 220,
                'is_vegetarian': True,
                'image_id': '251',
            },
            {
                'name': 'Halo-Halo',
                'description': 'Mixed shaved ice dessert with sweet beans, fruits, and ice cream',
                'category': 'Desserts',
                'item_type': 'DESSERT',
                'price': Decimal('75.00'),
                'cost_price': Decimal('30.00'),
                'preparation_time': 8,
                'calories': 350,
                'is_vegetarian': True,
                'image_id': '252',
            },
        ]

        menu_items = {}
        self.stdout.write(f'Categories dict keys: {list(categories.keys())}')
        for item_data in menu_items_data:
            cat_name = item_data.pop('category')  # Pop to avoid conflict with defaults
            self.stdout.write(f'Looking up category: "{cat_name}"')
            category = categories.get(cat_name)
            if category is None:
                self.stdout.write(self.style.ERROR(f'Category not found: {cat_name}'))
                continue
            self.stdout.write(f'Found category: {category} (type: {type(category)})')
            image_id = item_data.pop('image_id')
            item_data['image'] = f'https://picsum.photos/id/{image_id}/400/300'

            item, created = MenuItem.objects.get_or_create(
                name=item_data['name'],
                category=category,
                defaults={
                    **item_data,
                    'is_active': True,
                    'status': 'AVAILABLE',
                    'display_order': menu_items_data.index(item_data) + 1,
                    'created_by': admin_user,
                }
            )
            menu_items[item_data['name']] = item
            if created:
                self.stdout.write(f'Created menu item: {item.name}')

        # Create RecipeIngredients linking menu items to inventory ingredients
        # Map ingredients by name for easier lookup
        ingredient_map = {ing.name.lower(): ing for ing in ingredients}

        # Define recipe ingredients for each menu item
        recipes = {
            'Sisig Burger': [
                ('Pork', Decimal('0.15'), 'KG'),
                ('Onion', Decimal('0.02'), 'KG'),
                ('Siling green', Decimal('0.005'), 'KG'),
                ('Mayo', Decimal('0.02'), 'KG'),
            ],
            'Sisig Meal': [
                ('Pork', Decimal('0.25'), 'KG'),
                ('Chicken Liver', Decimal('0.05'), 'KG'),
                ('Onion', Decimal('0.03'), 'KG'),
                ('Siling green', Decimal('0.01'), 'KG'),
                ('Kalamansi', Decimal('0.02'), 'KG'),
                ('Egg', Decimal('1'), 'PCS'),
                ('Rice', Decimal('0.2'), 'KG'),
            ],
            'Sisig Sizzler': [
                ('Pork', Decimal('0.3'), 'KG'),
                ('Chicken Liver', Decimal('0.05'), 'KG'),
                ('Onion', Decimal('0.05'), 'KG'),
                ('Siling green', Decimal('0.01'), 'KG'),
                ('Kalamansi', Decimal('0.03'), 'KG'),
                ('Butter', Decimal('0.01'), 'KG'),
            ],
            'Sisig (Solo)': [
                ('Pork', Decimal('0.2'), 'KG'),
                ('Chicken Liver', Decimal('0.03'), 'KG'),
                ('Onion', Decimal('0.03'), 'KG'),
                ('Siling green', Decimal('0.005'), 'KG'),
                ('Kalamansi', Decimal('0.02'), 'KG'),
            ],
            'Sisig Family Pack': [
                ('Pork', Decimal('0.8'), 'KG'),
                ('Chicken Liver', Decimal('0.15'), 'KG'),
                ('Onion', Decimal('0.1'), 'KG'),
                ('Siling green', Decimal('0.02'), 'KG'),
                ('Kalamansi', Decimal('0.05'), 'KG'),
                ('Butter', Decimal('0.03'), 'KG'),
            ],
            'Chicken Sisig Rice Bowl': [
                ('Chicken Breast', Decimal('0.2'), 'KG'),
                ('Onion', Decimal('0.03'), 'KG'),
                ('Siling green', Decimal('0.005'), 'KG'),
                ('Kalamansi', Decimal('0.02'), 'KG'),
                ('Rice', Decimal('0.2'), 'KG'),
                ('Egg', Decimal('1'), 'PCS'),
            ],
            'Bangus Sisig Meal': [
                ('Bangus', Decimal('0.3'), 'KG'),
                ('Onion', Decimal('0.03'), 'KG'),
                ('Ginger', Decimal('0.01'), 'KG'),
                ('Kalamansi', Decimal('0.02'), 'KG'),
                ('Rice', Decimal('0.2'), 'KG'),
                ('Egg', Decimal('1'), 'PCS'),
            ],
            'Tofu Sisig (Vegetarian)': [
                ('Tofu', Decimal('0.3'), 'KG'),
                ('Onion', Decimal('0.03'), 'KG'),
                ('Siling green', Decimal('0.005'), 'KG'),
                ('Kalamansi', Decimal('0.02'), 'KG'),
                ('Rice', Decimal('0.2'), 'KG'),
            ],
            'Sisig Nachos': [
                ('Pork', Decimal('0.15'), 'KG'),
                ('Cheese', Decimal('0.05'), 'KG'),
                ('Siling green', Decimal('0.01'), 'KG'),
                ('Tortilla Chips', Decimal('0.1'), 'KG'),
            ],
            'Lumpia Shanghai': [
                ('Pork', Decimal('0.15'), 'KG'),
                ('Carrots', Decimal('0.02'), 'KG'),
                ('Onion', Decimal('0.02'), 'KG'),
                ('Lumpia Wrapper', Decimal('10'), 'PCS'),
                ('Oil', Decimal('0.1'), 'L'),
            ],
            'Chicharon Bulaklak': [
                ('Pork Intestines', Decimal('0.3'), 'KG'),
                ('Oil', Decimal('0.5'), 'L'),
                ('Vinegar', Decimal('0.02'), 'L'),
                ('Onion', Decimal('0.01'), 'KG'),
            ],
            'Iced Tea': [
                ('Tea Bags', Decimal('1'), 'PCS'),
                ('Sugar', Decimal('0.02'), 'KG'),
                ('Ice', Decimal('0.2'), 'KG'),
                ('Water', Decimal('0.3'), 'L'),
            ],
            'Soda (Coke/Sprite/Royal)': [
                ('Soda Can', Decimal('1'), 'PCS'),
            ],
            'Buko Juice': [
                ('Young Coconut', Decimal('1'), 'PCS'),
                ('Ice', Decimal('0.1'), 'KG'),
            ],
            'Leche Flan': [
                ('Egg', Decimal('4'), 'PCS'),
                ('Condensed Milk', Decimal('0.2'), 'KG'),
                ('Evaporated Milk', Decimal('0.2'), 'KG'),
                ('Sugar', Decimal('0.1'), 'KG'),
            ],
            'Halo-Halo': [
                ('Shaved Ice', Decimal('0.3'), 'KG'),
                ('Sweet Beans', Decimal('0.05'), 'KG'),
                ('Fruits', Decimal('0.1'), 'KG'),
                ('Ice Cream', Decimal('0.05'), 'KG'),
                ('Milk', Decimal('0.1'), 'L'),
                ('Leche Flan', Decimal('0.05'), 'KG'),
            ],
        }

        for item_name, recipe_ingredients in recipes.items():
            if item_name not in menu_items:
                continue
            menu_item = menu_items[item_name]

            for ing_name, quantity, unit in recipe_ingredients:
                ing_key = ing_name.lower()
                # Try exact match first, then partial match
                ingredient = ingredient_map.get(ing_key)
                if not ingredient:
                    # Try partial match
                    for key, val in ingredient_map.items():
                        if ing_key in key or key in ing_key:
                            ingredient = val
                            break

                if ingredient:
                    RecipeIngredient.objects.get_or_create(
                        menu_item=menu_item,
                        ingredient=ingredient,
                        defaults={
                            'quantity': quantity,
                            'unit': unit,
                            'is_optional': False,
                        }
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Ingredient not found: {ing_name} for {item_name}')
                    )

        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))

        # Create some sample stock movements for sales data
        self.create_sample_sales_data(admin_user)

    def create_sample_sales_data(self, user):
        """Create sample stock movements to simulate sales (ORDER_DEDUCTION)"""
        self.stdout.write('Creating sample sales data (stock movements)...')

        ingredients = Ingredient.objects.filter(is_active=True)
        if not ingredients.exists():
            return

        # Create stock movements for the last 7 days
        for days_ago in range(7):
            date = timezone.now() - timedelta(days=days_ago)
            # Random number of orders per day (5-20)
            num_orders = random.randint(5, 20)

            for _ in range(num_orders):
                # Pick random ingredients to deduct
                selected_ingredients = random.sample(list(ingredients), k=min(3, ingredients.count()))

                for ingredient in selected_ingredients:
                    if ingredient.quantity <= 0:
                        continue

                    # Deduct random amount (0.1 to 2 kg/pcs)
                    deduction = Decimal(str(round(random.uniform(0.1, 2.0), 2)))
                    if deduction > ingredient.quantity:
                        deduction = ingredient.quantity

                    if deduction <= 0:
                        continue

                    qty_before = ingredient.quantity
                    qty_after = qty_before - deduction

                    StockMovement.objects.create(
                        ingredient=ingredient,
                        quantity_before=qty_before,
                        quantity_change=-deduction,
                        quantity_after=qty_after,
                        reason=StockMovementReason.ORDER_DEDUCTION,
                        reference_id=f'ORD-{date.strftime("%Y%m%d")}-{random.randint(1000,9999)}',
                        notes=f'Order deduction for {date.strftime("%b %d")}',
                        created_by=user,
                        created_at=date,
                    )

                    # Update ingredient quantity
                    ingredient.quantity = qty_after
                    ingredient.save(update_fields=['quantity'])

        self.stdout.write(self.style.SUCCESS('Sample sales data (stock movements) created!'))