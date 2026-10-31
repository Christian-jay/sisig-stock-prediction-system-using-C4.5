"""
Settings serializers - UserSettings serialization.
"""
from rest_framework import serializers
from .models import UserSettings


class UserSettingsSerializer(serializers.ModelSerializer):
    """Serializer for user settings."""
    last_backup_formatted = serializers.CharField(read_only=True)

    class Meta:
        model = UserSettings
        fields = [
            'id',
            'language',
            'theme_mode',
            'email_alerts_for_new_orders',
            'in_app_sound_alerts',
            'sms_notifications',
            'enable_automatic_daily_backups',
            'last_successful_backup',
            'last_backup_formatted',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'last_successful_backup', 'last_backup_formatted', 'created_at', 'updated_at']


class UserSettingsUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user settings (partial updates)."""

    class Meta:
        model = UserSettings
        fields = [
            'language',
            'theme_mode',
            'email_alerts_for_new_orders',
            'in_app_sound_alerts',
            'sms_notifications',
            'enable_automatic_daily_backups',
        ]