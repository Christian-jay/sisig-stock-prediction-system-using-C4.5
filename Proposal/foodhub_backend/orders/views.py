"""
Orders views - Order management and dashboard analytics.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, DecimalField, ExpressionWrapper
from django.db.models.functions import TruncDate, Coalesce
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from django.db.models import Q

from .models import Order, OrderItem, OrderStatus, PaymentMethod
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderStatusSerializer,
    OrderUpdateSerializer, DashboardOrderSerializer
)


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for order management.
    """
    queryset = Order.objects.select_related('created_by', 'served_by').prefetch_related('items__menu_item').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['order_number']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update_status', 'partial_update']:
            return OrderStatusSerializer
        elif self.action == 'recent':
            return DashboardOrderSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        """Create order and return full order data."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(created_by=request.user)
        # Return full order data using OrderSerializer
        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )

    def get_queryset(self):
        qs = super().get_queryset()
        # Filter by status if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status."""
        order = self.get_object()
        serializer = OrderStatusSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data.get('status')
        if new_status == OrderStatus.COMPLETED and order.status != OrderStatus.COMPLETED:
            order.completed_at = timezone.now()
        elif new_status == OrderStatus.CANCELLED:
            # TODO: Restore inventory
            pass

        order = serializer.save()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['patch'])
    def update_details(self, request, pk=None):
        """Update order details including items (payment method, discount, tax, notes, order type, items)."""
        from django.db import transaction

        order = self.get_object()
        serializer = OrderUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Handle items update within transaction
        items_data = serializer.validated_data.pop('items', None)

        with transaction.atomic():
            # Update order fields
            order = serializer.save()

            # Update items if provided
            if items_data is not None:
                self._update_order_items(order, items_data)

                # Recalculate totals from items
                order.save()  # This triggers the save() method which recalculates subtotal/total

        # Return full updated order with items
        return Response(OrderSerializer(order).data)

    def _update_order_items(self, order, items_data):
        """Update order items: create new, update existing, delete removed."""
        from menu.models import MenuItem

        # Get existing items keyed by menu_item_id
        existing_items = {item.menu_item_id: item for item in order.items.all()}
        received_menu_item_ids = set()

        for item_data in items_data:
            menu_item_id = item_data['menu_item'].id if hasattr(item_data['menu_item'], 'id') else item_data['menu_item']
            quantity = item_data['quantity']
            notes = item_data.get('notes', '')

            received_menu_item_ids.add(menu_item_id)

            if menu_item_id in existing_items:
                # Update existing item
                item = existing_items[menu_item_id]
                item.quantity = quantity
                item.notes = notes
                item.save()  # This recalculates line_total and triggers order.save()
            else:
                # Create new item
                menu_item = MenuItem.objects.get(id=menu_item_id)
                OrderItem.objects.create(
                    order=order,
                    menu_item=menu_item,
                    quantity=quantity,
                    notes=notes
                )

        # Delete items not in the received list
        for menu_item_id, item in existing_items.items():
            if menu_item_id not in received_menu_item_ids:
                item.delete()

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent orders for dashboard."""
        limit = int(request.query_params.get('limit', 10))
        orders = self.get_queryset()[:limit]
        serializer = DashboardOrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today_stats(self, request):
        """Get today's order statistics."""
        today = timezone.now().date()
        today_orders = Order.objects.filter(created_at__date=today)

        stats = today_orders.aggregate(
            total_orders=Count('id'),
            total_revenue=Coalesce(Sum('total_amount', output_field=DecimalField()), Decimal('0')),
            completed_orders=Count('id', filter=Q(status=OrderStatus.COMPLETED)),
            processing_orders=Count('id', filter=Q(status=OrderStatus.PROCESSING)),
            pending_orders=Count('id', filter=Q(status=OrderStatus.PENDING)),
        )

        total_revenue = stats['total_revenue'] or Decimal('0')
        total_orders = stats['total_orders'] or 0

        return Response({
            'date': today.isoformat(),
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'completed_orders_today': stats['completed_orders'] or 0,
            'processing_orders_today': stats['processing_orders'] or 0,
            'pending_orders_today': stats['pending_orders'] or 0,
            'avg_order_value': float(total_revenue / total_orders) if total_orders > 0 else 0,
        })

    @action(detail=False, methods=['get'])
    def sales_overview(self, request):
        """Get sales overview for charts (last N days)."""
        try:
            days = int(request.query_params.get('days', 7))
            if days not in [7, 30, 90]:
                days = 7
        except (TypeError, ValueError):
            days = 7

        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days - 1)

        # Get daily sales
        daily_sales = Order.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            status=OrderStatus.COMPLETED
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('date')

        # Fill missing dates with 0
        sales_dict = {item['date']: float(item['total']) for item in daily_sales}
        labels = []
        values = []

        for i in range(days):
            current_date = start_date + timedelta(days=i)
            labels.append(current_date.strftime('%b %d'))
            values.append(sales_dict.get(current_date, 0.0))

        max_value = max(values) if values and max(values) > 0 else 10000

        return Response({
            'days': days,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'labels': labels,
            'values': values,
            'max_value': float(max_value),
        })

    @action(detail=False, methods=['get'])
    def top_selling(self, request):
        """Get top selling menu items."""
        try:
            limit = int(request.query_params.get('limit', 5))
        except (TypeError, ValueError):
            limit = 5

        # Get top selling items from completed orders
        top_items = OrderItem.objects.filter(
            order__status=OrderStatus.COMPLETED
        ).values(
            'menu_item__name'
        ).annotate(
            total_sold=Sum('quantity'),
            total_revenue=Sum('line_total')
        ).order_by('-total_sold')[:limit]

        # Calculate percentages
        total_sold_all = sum(item['total_sold'] or 0 for item in top_items)

        result = []
        for i, item in enumerate(top_items):
            sold = item['total_sold'] or 0
            percentage = round((sold / total_sold_all * 100), 1) if total_sold_all > 0 else 0
            result.append({
                'rank': f'{i+1}.',
                'name': item['menu_item__name'],
                'percentage': f'{percentage}%',
                'total_sold': sold,
                'revenue': f'₱{float(item["total_revenue"] or 0):,.2f}',
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def low_stock_ingredients(self, request):
        """Get ingredients that need restocking based on recent sales."""
        # This would ideally analyze sales velocity vs current stock
        # For now, delegate to inventory
        from inventory.models import Ingredient
        from django.db.models import F

        low_stock = Ingredient.objects.filter(
            is_active=True,
            quantity__gt=0,
            quantity__lte=F('reorder_level')
        ).order_by('quantity')[:10]

        out_of_stock = Ingredient.objects.filter(
            is_active=True,
            quantity__lte=0
        ).order_by('quantity')[:10]

        all_items = list(low_stock) + list(out_of_stock)

        data = []
        for item in all_items:
            status = 'Out of Stock' if item.quantity <= 0 else 'Low Stock'
            data.append({
                'ingredient': item.name,
                'quantity': float(item.quantity),
                'unit': item.unit,
                'status': status,
            })

        return Response(data)


# Import models for the today_stats action
from django.db import models