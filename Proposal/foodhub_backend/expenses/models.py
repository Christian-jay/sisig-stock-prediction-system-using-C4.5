"""
Expenses models - Daily expense tracking for FOODHUB.
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class ExpenseCategory(models.TextChoices):
    SUPPLIES = 'SUPPLIES', _('Supplies')
    UTILITIES = 'UTILITIES', _('Utilities')
    OTHERS = 'OTHERS', _('Others')
    INGREDIENTS = 'INGREDIENTS', _('Ingredients')


class Expense(models.Model):
    """
    Expense model - represents a daily expense record.
    """
    description = models.CharField(_('description'), max_length=200)
    category = models.CharField(
        _('category'),
        max_length=20,
        choices=ExpenseCategory.choices,
        default=ExpenseCategory.SUPPLIES
    )
    amount = models.DecimalField(_('amount'), max_digits=10, decimal_places=2)
    date = models.DateField(_('date'))
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_expenses',
        verbose_name=_('created by')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        db_table = 'expenses_expense'
        verbose_name = _('expense')
        verbose_name_plural = _('expenses')
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['date']),
            models.Index(fields=['created_by']),
        ]

    def __str__(self):
        return f"{self.description} - ₱{self.amount} ({self.date})"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.amount <= 0:
            raise ValidationError(_('Amount must be greater than zero.'))