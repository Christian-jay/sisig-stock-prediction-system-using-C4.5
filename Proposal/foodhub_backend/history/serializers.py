"""History serializers - persistent activity audit records."""
from rest_framework import serializers

from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'reference', 'category', 'category_display',
            'action', 'details', 'user', 'user_name', 'result',
            'timestamp', 'metadata'
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        if not obj.user:
            return 'System'
        full_name = obj.user.get_full_name().strip()
        return full_name or obj.user.get_username() or obj.user.email
