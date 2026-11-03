"""
History views - read-only activity audit trail for administrators.
"""
from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.permissions import IsAdminUser

from .models import ActivityCategory, ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Expose persistent activity records with server-side filtering."""
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'reference', 'action', 'details', 'result',
        'user__username', 'user__email',
        'user__first_name', 'user__last_name'
    ]
    ordering_fields = ['timestamp', 'reference', 'category', 'result']
    ordering = ['-timestamp', '-id']

    def get_queryset(self):
        queryset = super().get_queryset()

        category = (self.request.query_params.get('category') or '').strip().lower()
        if category and category != 'all':
            if category not in {choice.value for choice in ActivityCategory}:
                return queryset.none()
            queryset = queryset.filter(category=category)

        date_from = self._parse_query_date(
            self.request.query_params.get('date_from')
            or self.request.query_params.get('from_date'),
            'date_from'
        )
        date_to = self._parse_query_date(
            self.request.query_params.get('date_to')
            or self.request.query_params.get('to_date'),
            'date_to'
        )

        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)
        return queryset

    @staticmethod
    def _parse_query_date(value, name):
        if not value:
            return None
        parsed = parse_date(value)
        if not parsed:
            raise ValidationError({name: 'Use the YYYY-MM-DD date format.'})
        return parsed

    def _summary(self, queryset):
        counts = queryset.aggregate(
            total_logs=Count('id'),
            orders=Count('id', filter=Q(category=ActivityCategory.ORDERS)),
            inventory=Count('id', filter=Q(category=ActivityCategory.INVENTORY)),
            menu=Count('id', filter=Q(category=ActivityCategory.MENU)),
            sales=Count('id', filter=Q(category=ActivityCategory.SALES)),
            settings=Count('id', filter=Q(category=ActivityCategory.SETTINGS)),
            system=Count('id', filter=Q(category=ActivityCategory.SYSTEM)),
        )
        counts['system_admin'] = counts['settings'] + counts['system']
        return counts

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        summary = self._summary(queryset)
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            response.data['summary'] = summary
            return response

        return Response({
            'count': queryset.count(),
            'total_pages': 1,
            'current_page': 1,
            'page_size': queryset.count(),
            'next': None,
            'previous': None,
            'results': self.get_serializer(queryset, many=True).data,
            'summary': summary,
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Return counts using the same filters as the activity list."""
        queryset = self.filter_queryset(self.get_queryset())
        return Response(self._summary(queryset), status=status.HTTP_200_OK)
