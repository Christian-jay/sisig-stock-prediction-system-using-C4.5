"""
Dashboard views - Aggregated analytics API endpoints.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, Q, DecimalField
from django.db.models.functions import TruncDate, Coalesce
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from inventory.models import Ingredient, StockMovement, StockMovementReason
from menu.models import MenuItem, MenuCategory
from accounts.models import User
from orders.models import Order, OrderItem, OrderStatus, PaymentMethod


class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for dashboard analytics.
    Aggregates data from inventory, menu, and orders apps.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """
        Get dashboard summary metrics.
        """
        # Inventory metrics
        ingredients = Ingredient.objects.filter(is_active=True)
        total_items = ingredients.count()
        low_stock_count = ingredients.filter(
            quantity__gt=0,
            quantity__lte=F('reorder_level')
        ).count()
        out_of_stock_count = ingredients.filter(quantity__lte=0).count()

        # Menu metrics
        total_menu_items = MenuItem.objects.filter(is_active=True, status=MenuItem.Status.AVAILABLE).count()

        # User metrics (customers = non-staff users)
        total_customers = User.objects.filter(is_staff=False, is_active=True).count()

        # Order metrics - today's stats
        today = timezone.now().date()
        today_orders = Order.objects.filter(created_at__date=today)

        today_stats = today_orders.aggregate(
            total_orders=Count('id'),
            total_revenue=Coalesce(Sum('total_amount'), Decimal('0')),
            completed_orders=Count('id', filter=Q(status=OrderStatus.COMPLETED)),
            pending_orders=Count('id', filter=Q(status=OrderStatus.PENDING)),
        )

        # All-time stats
        all_time_stats = Order.objects.filter(status=OrderStatus.COMPLETED).aggregate(
            total_revenue=Coalesce(Sum('total_amount'), Decimal('0')),
            total_orders=Count('id'),
        )

        return Response({
            'total_sales': f'₱{float(all_time_stats["total_revenue"]):,.2f}',
            'total_orders': all_time_stats['total_orders'],
            'today_orders': today_stats['total_orders'],
            'today_revenue': f'₱{float(today_stats["total_revenue"]):,.2f}',
            'completed_orders_today': today_stats['completed_orders'],
            'pending_orders_today': today_stats['pending_orders'],
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'total_menu_items': total_menu_items,
            'total_customers': total_customers,
        })

    @action(detail=False, methods=['get'])
    def sales_overview(self, request):
        """
        Get daily sales for the last N days (default 7).
        Query params: days=7|30|90
        """
        try:
            days = int(request.query_params.get('days', 7))
            if days not in [7, 30, 90]:
                days = 7
        except (TypeError, ValueError):
            days = 7

        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days - 1)

        # Get daily sales from completed orders
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
        """
        Get top selling menu items.
        Query params: limit=5|10
        """
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
    def recent_orders(self, request):
        """
        Get recent orders.
        Query params: limit=5|10
        """
        try:
            limit = int(request.query_params.get('limit', 10))
        except (TypeError, ValueError):
            limit = 10

        orders = Order.objects.select_related('created_by').prefetch_related('items__menu_item').order_by('-created_at')[:limit]

        data = []
        for order in orders:
            items_summary = ', '.join([
                f"{item.menu_item.name} (x{item.quantity})"
                for item in order.items.all()[:3]
            ])
            if order.items.count() > 3:
                items_summary += f' +{order.items.count() - 3} more'

            data.append({
                'id': order.id,
                'order_number': order.order_number,
                'items_summary': items_summary,
                'total_amount': f'₱{float(order.total_amount):,.2f}',
                'status': order.status,
                'status_display': order.get_status_display(),
                'payment_method': order.payment_method,
                'payment_status': order.payment_status,
                'created_at': order.created_at.isoformat(),
            })

        return Response(data)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Get low stock and out of stock ingredients for dashboard.
        """
        low_stock = Ingredient.objects.filter(
            is_active=True,
            quantity__gt=0,
            quantity__lte=F('reorder_level')
        ).order_by('quantity')[:10]

        out_of_stock = Ingredient.objects.filter(
            is_active=True,
            quantity__lte=0
        ).order_by('quantity')[:10]

        all_low_stock = list(low_stock) + list(out_of_stock)

        data = []
        for item in all_low_stock:
            if item.quantity <= 0:
                status = 'Out of Stock'
            else:
                status = 'Low Stock'
            data.append({
                'ingredient': item.name,
                'quantity': float(item.quantity),
                'unit': item.unit,
                'status': status,
            })

        return Response(data)

    @action(detail=False, methods=['get'])
    def full(self, request):
        """
        Get all dashboard data in one call (for initial load).
        """
        metrics_resp = self.metrics(request)
        sales_resp = self.sales_overview(request)
        top_resp = self.top_selling(request)
        recent_resp = self.recent_orders(request)
        low_stock_resp = self.low_stock(request)

        return Response({
            'metrics': metrics_resp.data,
            'sales_overview': sales_resp.data,
            'top_selling': top_resp.data,
            'recent_orders': recent_resp.data,
            'low_stock': low_stock_resp.data,
        })