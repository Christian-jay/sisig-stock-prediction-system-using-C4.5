"""
Settings models - User preferences and system settings.
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class UserSettings(models.Model):
    """
    User-specific settings and preferences.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='settings',
        verbose_name=_('user')
    )

    # General Settings
    language = models.CharField(
        _('language'),
        max_length=20,
        choices=[
            ('English', 'English'),
            ('Tagalog', 'Tagalog'),
        ],
        default='English'
    )
    theme_mode = models.CharField(
        _('theme mode'),
        max_length=10,
        choices=[
            ('light', 'Light'),
            ('dark', 'Dark'),
        ],
        default='light'
    )

    # Notification Settings
    email_alerts_for_new_orders = models.BooleanField(
        _('email alerts for new orders'),
        default=True
    )
    in_app_sound_alerts = models.BooleanField(
        _('in-app sound alerts'),
        default=True
    )
    sms_notifications = models.BooleanField(
        _('SMS notifications'),
        default=False
    )

    # Backup Settings
    enable_automatic_daily_backups = models.BooleanField(
        _('enable automatic daily backups'),
        default=True
    )
    last_successful_backup = models.DateTimeField(
        _('last successful backup'),
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        db_table = 'settings_usersettings'
        verbose_name = _('user settings')
        verbose_name_plural = _('user settings')

    def __str__(self):
        return f"Settings for {self.user.email}"

    @property
    def last_backup_formatted(self):
        """Return formatted last backup date for display."""
        if self.last_successful_backup:
            return self.last_successful_backup.strftime('%B %d, %Y - %I:%M %p')
        return 'Never'