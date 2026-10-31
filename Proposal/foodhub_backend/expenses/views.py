"""
Expenses views - Expense tracking API endpoints.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import datetime
from .models import Expense, ExpenseCategory
from .serializers import (
    ExpenseSerializer, ExpenseCreateSerializer, ExpenseUpdateSerializer,
    ExpenseCategorySerializer, ExpenseSummarySerializer
)
from core.permissions import IsStaffUser


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for expense management.
    Staff and Admins: full CRUD on their own expenses.
    Admins: view all expenses.
    """
    queryset = Expense.objects.select_related('created_by').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['description']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']
    permission_classes = [IsStaffUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return ExpenseCreateSerializer
        if self.action in ['update', 'partial_update']:
            return ExpenseUpdateSerializer
        return ExpenseSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # Admins see all expenses, staff see all expenses (shared)
        # No filtering by created_by for staff - all staff see same expenses

        # Date range filtering
        start_date = self.request.query_params.get('start_date') or self.request.query_params.get('date_from')
        end_date = self.request.query_params.get('end_date') or self.request.query_params.get('date_to')

        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create expense and return full object with ID."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Return full object using ExpenseSerializer
        response_serializer = ExpenseSerializer(serializer.instance)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update expense and return full object."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Return full object using ExpenseSerializer
        response_serializer = ExpenseSerializer(instance)
        return Response(response_serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get expense summary statistics for the requested date range.
        Query params: start_date, end_date, date_from, date_to (optional)
        """
        qs = self.get_queryset()

        # Aggregate statistics
        aggregates = qs.aggregate(
            total_expenses=Sum('amount'),
            total_records=Count('id')
        )

        total_expenses = aggregates['total_expenses'] or 0
        total_records = aggregates['total_records'] or 0

        # Highest spending category
        category_stats = qs.values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')

        highest_category = None
        if category_stats:
            top = category_stats.first()
            highest_category = {
                'category': top['category'],
                'category_display': dict(ExpenseCategory.choices).get(top['category'], top['category']),
                'total': float(top['total']),
                'count': top['count']
            }

        # Average expense
        average_expense = total_expenses / total_records if total_records > 0 else 0

        return Response({
            'total_expenses': float(total_expenses),
            'total_records': total_records,
            'highest_category': highest_category,
            'average_expense': float(average_expense),
        })

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available expense categories."""
        categories = [{'value': c.value, 'label': c.label} for c in ExpenseCategory]
        return Response(categories)