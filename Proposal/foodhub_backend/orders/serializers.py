"""
Orders serializers - Order and OrderItem serialization.
"""
from rest_framework import serializers
from .models import Order, OrderItem, OrderStatus, PaymentMethod
from menu.models import MenuItem


class MenuItemSimpleSerializer(serializers.ModelSerializer):
    """Simple serializer for menu item in orders."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'image', 'image_url', 'price']

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


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSimpleSerializer(read_only=True)
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_image = serializers.CharField(source='menu_item.image', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'menu_item', 'menu_item_name', 'menu_item_image',
            'quantity', 'unit_price', 'line_total', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'unit_price', 'line_total', 'created_at', 'updated_at']


class OrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['menu_item', 'quantity', 'notes']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'payment_status', 'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
            'notes', 'order_type',
            'created_by', 'created_by_name', 'served_by',
            'completed_at', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'tax_amount', 'total_amount',
            'created_by', 'created_at', 'updated_at', 'items'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, write_only=True)
    tax_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)

    class Meta:
        model = Order
        fields = [
            'payment_method', 'notes', 'order_type',
            'tax_amount', 'discount_amount','payment_status',
            'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)

        # Recalculate totals (save() will recalculate subtotal and total_amount)
        order.save()
        return order


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status', 'payment_status']
        extra_kwargs = {
            'status': {'required': True},
            'payment_status': {'required': False},
        }


class OrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order details including items."""
    items = OrderItemCreateSerializer(many=True, required=False)

    class Meta:
        model = Order
        fields = ['payment_method', 'payment_status', 'discount_amount', 'tax_amount', 'notes', 'order_type', 'items']


class DashboardOrderSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dashboard recent orders."""
    items_summary = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'items_summary', 'total_amount', 'status', 'created_at']

    def get_items_summary(self, obj):
        items = obj.items.all()[:3]  # First 3 items
        return ', '.join([f"{item.menu_item.name} (x{item.quantity})" for item in items])