"""
Settings views - User settings management and backup operations.
"""
import os
import shutil
from datetime import datetime
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from django.db import connection
from .models import UserSettings
from .serializers import UserSettingsSerializer, UserSettingsUpdateSerializer


class UserSettingsViewSet(viewsets.GenericViewSet):
    """
    ViewSet for user settings management.
    Users can only access their own settings.
    """
    serializer_class = UserSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Get or create settings for current user."""
        settings_obj, created = UserSettings.objects.get_or_create(user=self.request.user)
        return settings_obj

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserSettingsUpdateSerializer
        return UserSettingsSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's settings."""
        settings_obj = self.get_object()
        serializer = self.get_serializer(settings_obj)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_settings(self, request):
        """Update current user's settings."""
        settings_obj = self.get_object()
        serializer = self.get_serializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSettingsSerializer(settings_obj).data)

    @action(detail=False, methods=['post'])
    def backup(self, request):
        """Trigger a database backup operation."""
        settings_obj = self.get_object()

        try:
            backup_path = self._create_database_backup()

            # Only update timestamp AFTER successful backup
            settings_obj.last_successful_backup = timezone.now()
            settings_obj.save(update_fields=['last_successful_backup'])

            serializer = self.get_serializer(settings_obj)
            return Response({
                'detail': 'Backup completed successfully.',
                'backup_file': os.path.basename(backup_path),
                'settings': serializer.data
            })
        except Exception as e:
            # Log the error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Backup failed for user {request.user.id}: {str(e)}")

            return Response(
                {'detail': f'Backup failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _create_database_backup(self):
        """Create a backup of the SQLite database."""
        db_path = settings.DATABASES['default']['NAME']

        # Ensure backup directory exists
        backup_dir = os.path.join(settings.MEDIA_ROOT, 'backups')
        os.makedirs(backup_dir, exist_ok=True)

        # Generate unique backup filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'foodhub_backup_{timestamp}.sqlite3'
        backup_path = os.path.join(backup_dir, backup_filename)

        # For SQLite, we need to ensure we get a consistent backup
        # Use the SQLite backup API for safe copying even with active connections
        if connection.vendor == 'sqlite':
            # Use SQLite's backup API for consistent backup
            import sqlite3
            source = sqlite3.connect(db_path)
            dest = sqlite3.connect(backup_path)
            try:
                source.backup(dest)
            finally:
                dest.close()
                source.close()
        else:
            # For other databases, use file copy (may not be consistent for active DB)
            shutil.copy2(db_path, backup_path)

        # Verify backup file exists and is not empty
        if not os.path.exists(backup_path) or os.path.getsize(backup_path) == 0:
            raise Exception("Backup file was not created or is empty")

        return backup_path


class SystemBackupViewSet(viewsets.ViewSet):
    """
    ViewSet for system-wide backup operations (admin only).
    """
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        """Trigger a full system backup."""
        # Check if user is admin
        if request.user.role != 'ADMIN':
            return Response(
                {'detail': 'Only administrators can trigger system backups.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            backup_path = self._create_database_backup()

            return Response({
                'detail': 'System backup completed successfully.',
                'backup_file': os.path.basename(backup_path),
                'timestamp': timezone.now().isoformat()
            })
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"System backup failed: {str(e)}")

            return Response(
                {'detail': f'System backup failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _create_database_backup(self):
        """Create a backup of the SQLite database."""
        db_path = settings.DATABASES['default']['NAME']

        # Ensure backup directory exists
        backup_dir = os.path.join(settings.MEDIA_ROOT, 'backups')
        os.makedirs(backup_dir, exist_ok=True)

        # Generate unique backup filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'foodhub_system_backup_{timestamp}.sqlite3'
        backup_path = os.path.join(backup_dir, backup_filename)

        # For SQLite, use the SQLite backup API for consistent backup
        if connection.vendor == 'sqlite':
            import sqlite3
            source = sqlite3.connect(db_path)
            dest = sqlite3.connect(backup_path)
            try:
                source.backup(dest)
            finally:
                dest.close()
                source.close()
        else:
            shutil.copy2(db_path, backup_path)

        # Verify backup file exists and is not empty
        if not os.path.exists(backup_path) or os.path.getsize(backup_path) == 0:
            raise Exception("Backup file was not created or is empty")

        return backup_path