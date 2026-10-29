"""
Inventory views - Ingredient and StockMovement API endpoints.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Sum, F, Count
from django.utils import timezone
from datetime import timedelta
from .models import Ingredient, StockMovement, StockMovementReason, StockStatus
from .serializers import (
    IngredientSerializer, IngredientCreateSerializer, IngredientUpdateSerializer,
    StockMovementSerializer, StockMovementCreateSerializer,
    StockMovementReasonSerializer, StockStatusSerializer
)
from core.permissions import CanManageInventory, IsAdminUser


class IngredientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ingredient/inventory management.
    Admins: full CRUD. Staff: view and update quantities.
    """
    queryset = Ingredient.objects.select_related('created_by').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active', 'daily_usage']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'quantity', 'reorder_level', 'created_at', 'updated_at']
    ordering = ['category', 'name']

    def get_serializer_class(self):
        if self.action == 'create':
            return IngredientCreateSerializer
        if self.action in ['update', 'partial_update']:
            return IngredientUpdateSerializer
        return IngredientSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdminUser()]
        return [CanManageInventory()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[CanManageInventory])
    def adjust_stock(self, request, pk=None):
        """
        Adjust stock quantity with audit trail.
        Body: {"quantity_change": 5, "reason": "RESTOCK", "reference_id": "PO-123", "notes": "Received delivery"}
        """
        ingredient = self.get_object()
        quantity_change = request.data.get('quantity_change')
        reason = request.data.get('reason')
        reference_id = request.data.get('reference_id', '')
        notes = request.data.get('notes', '')

        if quantity_change is None:
            return Response(
                {'success': False, 'error': {'code': 400, 'message': 'quantity_change is required'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reason not in StockMovementReason.values:
            return Response(
                {'success': False, 'error': {'code': 400, 'message': f'Invalid reason. Must be one of: {list(StockMovementReason.values)}'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        from decimal import Decimal
        try:
            quantity_change = Decimal(str(quantity_change))
        except (TypeError, ValueError, decimal.InvalidOperation):
            return Response(
                {'success': False, 'error': {'code': 400, 'message': 'quantity_change must be a number'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            quantity_before = ingredient.quantity
            quantity_after = quantity_before + quantity_change

            if quantity_after < 0:
                return Response(
                    {'success': False, 'error': {'code': 400, 'message': 'Insufficient stock for this deduction'}},
                    status=status.HTTP_400_BAD_REQUEST
                )

            ingredient.quantity = quantity_after
            ingredient.save(update_fields=['quantity', 'updated_at'])

            StockMovement.objects.create(
                ingredient=ingredient,
                quantity_before=quantity_before,
                quantity_change=quantity_change,
                quantity_after=quantity_after,
                reason=reason,
                reference_id=reference_id,
                notes=notes,
                created_by=request.user
            )

        serializer = IngredientSerializer(ingredient)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': f'Stock adjusted by {quantity_change:+.3f} {ingredient.unit}'
        })

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get all low stock and out of stock ingredients."""
        low_stock = Ingredient.objects.filter(
            is_active=True
        ).filter(
            quantity__lte=F('reorder_level')
        ).exclude(quantity__gt=0)

        out_of_stock = Ingredient.objects.filter(is_active=True, quantity__lte=0)
        low_stock_only = Ingredient.objects.filter(
            is_active=True,
            quantity__gt=0,
            quantity__lte=F('reorder_level')
        )

        return Response({
            'out_of_stock': IngredientSerializer(out_of_stock, many=True).data,
            'low_stock': IngredientSerializer(low_stock_only, many=True).data,
        })

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available ingredient categories."""
        from .models import IngredientCategory
        categories = [{'value': c.value, 'label': c.label} for c in IngredientCategory]
        return Response(categories)

    @action(detail=False, methods=['get'])
    def units(self, request):
        """Get available units of measure."""
        from .models import UnitOfMeasure
        units = [{'value': u.value, 'label': u.label} for u in UnitOfMeasure]
        return Response(units)

    @action(detail=False, methods=['get'])
    def daily_usage_levels(self, request):
        """Get available daily usage levels."""
        from .models import DailyUsage
        levels = [{'value': d.value, 'label': d.label} for d in DailyUsage]
        return Response(levels)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get inventory summary statistics."""
        ingredients = Ingredient.objects.filter(is_active=True)
        total_items = ingredients.count()
        in_stock = ingredients.filter(quantity__gt=F('reorder_level')).count()
        low_stock = ingredients.filter(
            quantity__gt=0,
            quantity__lte=F('reorder_level')
        ).count()
        out_of_stock = ingredients.filter(quantity__lte=0).count()
        total_value = ingredients.aggregate(total=Sum(F('quantity') * F('unit_price')))['total'] or 0

        return Response({
            'total_items': total_items,
            'in_stock': in_stock,
            'low_stock': low_stock,
            'out_of_stock': out_of_stock,
            'total_value': float(total_value),
        })

    @action(detail=False, methods=['get'])
    def usage_history(self, request):
        """
        Get ingredient usage/consumption over time for the line chart.
        Query params: days=7|30|90 (default 7)
        Returns daily consumption aggregated from ORDER_DEDUCTION stock movements.
        """
        try:
            days = int(request.query_params.get('days', 7))
            if days not in [7, 30, 90]:
                days = 7
        except (TypeError, ValueError):
            days = 7

        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days - 1)

        # Get all ORDER_DEDUCTION movements in date range
        movements = StockMovement.objects.filter(
            reason=StockMovementReason.ORDER_DEDUCTION,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).select_related('ingredient')

        # Aggregate by date
        daily_data = {}
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            daily_data[current_date] = 0

        for movement in movements:
            movement_date = movement.created_at.date()
            if movement_date in daily_data:
                # quantity_change is negative for deductions, take absolute value
                daily_data[movement_date] += abs(float(movement.quantity_change))

        # Format for chart
        labels = []
        values = []
        for date, value in sorted(daily_data.items()):
            labels.append(date.strftime('%a'))  # Mon, Tue, etc.
            values.append(round(value, 3))

        return Response({
            'days': days,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'labels': labels,
            'values': values,
            'total_consumption': round(sum(values), 3)
        })


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for stock movement audit log (read-only).
    """
    queryset = StockMovement.objects.select_related('ingredient', 'created_by').all()
    serializer_class = StockMovementSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ingredient', 'reason', 'created_by']
    search_fields = ['ingredient__name', 'reference_id', 'notes']
    ordering_fields = ['created_at', 'quantity_change']
    ordering = ['-created_at']
    permission_classes = [CanManageInventory]

    @action(detail=False, methods=['get'])
    def reasons(self, request):
        """Get available stock movement reasons."""
        reasons = [{'value': r.value, 'label': r.label} for r in StockMovementReason]
        return Response(reasons)