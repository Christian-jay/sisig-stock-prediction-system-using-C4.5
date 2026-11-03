"""Helpers for recording server-side activity history."""
import logging

from .models import ActivityCategory, ActivityLog

logger = logging.getLogger(__name__)


def record_activity(
    *,
    user=None,
    category=ActivityCategory.SYSTEM,
    action='Activity',
    reference='—',
    details='',
    result='Success',
    metadata=None,
):
    """Create an audit entry without interrupting the business operation."""
    category_value = str(category or ActivityCategory.SYSTEM).lower()
    valid_categories = {choice.value for choice in ActivityCategory}
    if category_value not in valid_categories:
        category_value = ActivityCategory.SYSTEM

    try:
        return ActivityLog.objects.create(
            user=user if getattr(user, 'is_authenticated', False) else None,
            category=category_value,
            action=str(action or 'Activity'),
            reference=str(reference or '—'),
            details=str(details or ''),
            result=str(result or 'Success'),
            metadata=metadata if isinstance(metadata, dict) else {},
        )
    except Exception:
        # An audit failure must not roll back an otherwise successful user action.
        logger.exception('Unable to record FOODHUB activity history.')
        return None
