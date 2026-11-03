"""
History models - persistent activity audit records.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class ActivityCategory(models.TextChoices):
    ORDERS = 'orders', _('Orders')
    INVENTORY = 'inventory', _('Inventory')
    MENU = 'menu', _('Menu / Products')
    SALES = 'sales', _('Sales & Reports')
    SETTINGS = 'settings', _('Settings')
    SYSTEM = 'system', _('System / Admin')


class ActivityLog(models.Model):
    """
    Persistent audit entry for an administrative or operational action.

    Entries are append-only from the API. The user relationship is nullable so
    the history remains readable if an account is later removed.
    """
    reference = models.CharField(_('reference'), max_length=100, default='—')
    category = models.CharField(
        _('category'),
        max_length=20,
        choices=ActivityCategory.choices,
        default=ActivityCategory.SYSTEM,
        db_index=True
    )
    action = models.CharField(_('action'), max_length=120)
    details = models.TextField(_('details'), blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
        verbose_name=_('user')
    )
    result = models.CharField(_('result'), max_length=30, default='Success')
    timestamp = models.DateTimeField(_('timestamp'), default=timezone.now, db_index=True)
    metadata = models.JSONField(_('metadata'), default=dict, blank=True)

    class Meta:
        db_table = 'history_activitylog'
        verbose_name = _('activity log')
        verbose_name_plural = _('activity logs')
        ordering = ['-timestamp', '-id']
        indexes = [
            models.Index(fields=['category', '-timestamp']),
            models.Index(fields=['reference']),
            models.Index(fields=['user', '-timestamp']),
        ]

    def __str__(self):
        return f'{self.reference} - {self.action}'
