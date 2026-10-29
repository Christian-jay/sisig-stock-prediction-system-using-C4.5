"""
Inventory serializers - Ingredient and StockMovement serialization.
"""
from rest_framework import serializers
from .models import Ingredient, StockMovement, StockMovementReason, StockStatus


class StockMovementSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient_unit = serializers.CharField(source='ingredient.unit', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'ingredient', 'ingredient_name', 'ingredient_unit',
            'quantity_before', 'quantity_change', 'quantity_after',
            'reason', 'reason_display', 'reference_id', 'notes',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']


class StockMovementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = ['ingredient', 'quantity_before', 'quantity_change', 'quantity_after', 'reason', 'reference_id', 'notes']


class IngredientSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    daily_usage_display = serializers.CharField(source='get_daily_usage_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    recent_movements = serializers.SerializerMethodField()

    class Meta:
        model = Ingredient
        fields = [
            'id', 'name', 'category', 'category_display', 'quantity', 'unit', 'unit_display',
            'reorder_level', 'unit_price', 'daily_usage', 'daily_usage_display',
            'description', 'is_active', 'status', 'status_display', 'total_value',
            'created_at', 'updated_at', 'created_by', 'created_by_name', 'recent_movements'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'status', 'total_value']

    def get_recent_movements(self, obj):
        movements = obj.movements.all()[:5]
        return StockMovementSerializer(movements, many=True).data


class IngredientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = [
            'id', 'name', 'category', 'quantity', 'unit', 'reorder_level',
            'unit_price', 'daily_usage', 'description', 'is_active'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        if attrs.get('quantity', 0) < 0:
            raise serializers.ValidationError({'quantity': 'Quantity cannot be negative.'})
        if attrs.get('reorder_level', 0) < 0:
            raise serializers.ValidationError({'reorder_level': 'Reorder level cannot be negative.'})

        # Validate whole numbers for countable units
        unit = attrs.get('unit', '').lower()
        countable_units = ['pcs', 'piece', 'pieces', 'egg', 'eggs', 'tray', 'trays', 'pack', 'packs', 'box', 'boxes', 'bag', 'bags', 'sack', 'sacks', 'can', 'cans', 'bottle', 'bottles', 'jar', 'jars']
        is_countable = any(cu in unit for cu in countable_units)

        if is_countable:
            quantity = attrs.get('quantity')
            reorder_level = attrs.get('reorder_level')
            if quantity is not None and not float(quantity).is_integer():
                raise serializers.ValidationError({'quantity': 'Whole numbers only for countable units (pcs, pieces, eggs, trays, packs, etc.)'})
            if reorder_level is not None and not float(reorder_level).is_integer():
                raise serializers.ValidationError({'reorder_level': 'Whole numbers only for countable units'})

        return attrs


class IngredientUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = [
            'id', 'name', 'category', 'quantity', 'unit', 'reorder_level',
            'unit_price', 'daily_usage', 'description', 'is_active'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        # Reuse validation logic from create serializer
        if 'quantity' in attrs and attrs['quantity'] < 0:
            raise serializers.ValidationError({'quantity': 'Quantity cannot be negative.'})
        if 'reorder_level' in attrs and attrs['reorder_level'] < 0:
            raise serializers.ValidationError({'reorder_level': 'Reorder level cannot be negative.'})

        # Validate whole numbers for countable units
        unit = (attrs.get('unit') or (self.instance.unit if self.instance else '')).lower()
        countable_units = ['pcs', 'piece', 'pieces', 'egg', 'eggs', 'tray', 'trays', 'pack', 'packs', 'box', 'boxes', 'bag', 'bags', 'sack', 'sacks', 'can', 'cans', 'bottle', 'bottles', 'jar', 'jars']
        is_countable = any(cu in unit for cu in countable_units)

        if is_countable:
            if 'quantity' in attrs and attrs['quantity'] is not None and not float(attrs['quantity']).is_integer():
                raise serializers.ValidationError({'quantity': 'Whole numbers only for countable units (pcs, pieces, eggs, trays, packs, etc.)'})
            if 'reorder_level' in attrs and attrs['reorder_level'] is not None and not float(attrs['reorder_level']).is_integer():
                raise serializers.ValidationError({'reorder_level': 'Whole numbers only for countable units'})

        return attrs


class StockMovementReasonSerializer(serializers.Serializer):
    value = serializers.ChoiceField(choices=StockMovementReason.choices)
    label = serializers.CharField(source='get_reason_display', read_only=True)


class StockStatusSerializer(serializers.Serializer):
    value = serializers.ChoiceField(choices=StockStatus.choices)
    label = serializers.CharField(source='get_status_display', read_only=True)