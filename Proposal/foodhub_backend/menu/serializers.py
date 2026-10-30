"""
Menu serializers - API serialization for menu items and categories.
"""
from rest_framework import serializers
from .models import MenuCategory, MenuItem, RecipeIngredient


class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient_unit = serializers.CharField(source='ingredient.unit', read_only=True)
    ingredient_unit_price = serializers.DecimalField(source='ingredient.unit_price', max_digits=10, decimal_places=2, read_only=True)
    line_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ['id', 'ingredient', 'ingredient_name', 'ingredient_unit', 'ingredient_unit_price',
                  'quantity', 'unit', 'notes', 'is_optional', 'line_cost']


class MenuCategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = MenuCategory
        fields = ['id', 'name', 'description', 'display_order', 'is_active', 'item_count',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_item_count(self, obj):
        return obj.items.filter(is_active=True).count()


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_display_order = serializers.IntegerField(source='category.display_order', read_only=True)
    recipe_ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    total_recipe_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'description', 'category', 'category_name', 'category_display_order',
                  'item_type', 'price', 'cost_price', 'image', 'image_url', 'is_active', 'status',
                  'preparation_time', 'calories', 'allergens', 'is_vegetarian', 'is_vegan',
                  'is_gluten_free', 'display_order', 'recipe_ingredients', 'profit_margin',
                  'total_recipe_cost', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'profit_margin', 'total_recipe_cost']

    def get_image_url(self, obj):
        if obj.image:
            # If image is already an absolute URL (external), return as-is
            image_url = obj.image.url
            if image_url.startswith('http://') or image_url.startswith('https://'):
                return image_url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_url)
        return None


class MenuItemSimpleSerializer(serializers.ModelSerializer):
    """Lightweight serializer for menu items in dropdowns/lists."""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'price', 'category_name', 'status', 'item_type']