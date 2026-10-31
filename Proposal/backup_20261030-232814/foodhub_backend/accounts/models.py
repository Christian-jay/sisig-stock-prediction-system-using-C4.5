"""
Accounts models - Custom User model with roles and UserProfile.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class Role(models.TextChoices):
    ADMIN = 'ADMIN', _('Administrator')
    STAFF = 'STAFF', _('Staff')


class User(AbstractUser):
    """
    Custom user model with role-based access control.
    """
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(
        _('role'),
        max_length=10,
        choices=Role.choices,
        default=Role.STAFF,
    )
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'accounts_user'
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_staff_user(self):
        return self.role == Role.STAFF


class UserProfile(models.Model):
    """
    Extended profile information for users.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name=_('user')
    )
    phone = models.CharField(_('phone'), max_length=20, blank=True)
    address = models.TextField(_('address'), blank=True)
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        db_table = 'accounts_userprofile'
        verbose_name = _('user profile')
        verbose_name_plural = _('user profiles')

    def __str__(self):
        return f"Profile: {self.user.email}"