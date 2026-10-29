"""
Inventory models - Ingredients and stock movements.
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class IngredientCategory(models.TextChoices):
    MEAT = 'MEAT', _('Meat')
    VEGETABLES = 'VEGETABLES', _('Vegetables')
    CONDIMENTS = 'CONDIMENTS', _('Condiments')
    SAUCES = 'SAUCES', _('Sauces')
    SPICES = 'SPICES', _('Spices')
    DAIRY = 'DAIRY', _('Dairy')
    POULTRY = 'POULTRY', _('Poultry')
    BEVERAGES = 'BEVERAGES', _('Beverages')
    OTHERS = 'OTHERS', _('Others')


class UnitOfMeasure(models.TextChoices):
    KG = 'KG', _('Kilogram')
    G = 'G', _('Gram')
    L = 'L', _('Liter')
    ML = 'ML', _('Milliliter')
    PCS = 'PCS', _('Pieces')
    CANS = 'CANS', _('Cans')
    PACKS = 'PACKS', _('Packs')


class DailyUsage(models.TextChoices):
    HIGH = 'HIGH', _('High')
    MEDIUM = 'MEDIUM', _('Medium')
    LOW = 'LOW', _('Low')


class StockStatus(models.TextChoices):
    IN_STOCK = 'IN STOCK', _('In Stock')
    LOW_STOCK = 'LOW STOCK', _('Low Stock')
    OUT_OF_STOCK = 'OUT OF STOCK', _('Out of Stock')


class StockMovementReason(models.TextChoices):
    ORDER_DEDUCTION = 'ORDER_DEDUCTION', _('Order Deduction')
    RESTOCK = 'RESTOCK', _('Restock')
    WASTE = 'WASTE', _('Waste/Damage')
    ADJUSTMENT = 'ADJUSTMENT', _('Manual Adjustment')
    RETURN = 'RETURN', _('Return')
    INITIAL = 'INITIAL', _('Initial Stock')


class Ingredient(models.Model):
    """
    Ingredient/Inventory item model.
    """
    name = models.CharField(_('name'), max_length=100)
    category = models.CharField(
        _('category'),
        max_length=20,
        choices=IngredientCategory.choices,
        default=IngredientCategory.OTHERS
    )
    quantity = models.DecimalField(_('quantity'), max_digits=10, decimal_places=3, default=0)
    unit = models.CharField(
        _('unit'),
        max_length=10,
        choices=UnitOfMeasure.choices,
        default=UnitOfMeasure.KG
    )
    reorder_level = models.DecimalField(_('reorder level'), max_digits=10, decimal_places=3, default=0)
    unit_price = models.DecimalField(_('unit price'), max_digits=10, decimal_places=2, default=0)
    daily_usage = models.CharField(
        _('daily usage'),
        max_length=10,
        choices=DailyUsage.choices,
        default=DailyUsage.LOW
    )
    description = models.TextField(_('description'), blank=True)
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_ingredients',
        verbose_name=_('created by')
    )

    class Meta:
        db_table = 'inventory_ingredient'
        verbose_name = _('ingredient')
        verbose_name_plural = _('ingredients')
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"

    @property
    def status(self):
        if self.quantity <= 0:
            return StockStatus.OUT_OF_STOCK
        if self.quantity <= self.reorder_level:
            return StockStatus.LOW_STOCK
        return StockStatus.IN_STOCK

    @property
    def total_value(self):
        return self.quantity * self.unit_price

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('ingredient-detail', kwargs={'pk': self.pk})

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.quantity < 0:
            raise ValidationError(_('Quantity cannot be negative.'))
        if self.reorder_level < 0:
            raise ValidationError(_('Reorder level cannot be negative.'))


class StockMovement(models.Model):
    """
    Stock movement audit log - append only.
    """
    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.PROTECT,
        related_name='movements',
        verbose_name=_('ingredient')
    )
    quantity_before = models.DecimalField(_('quantity before'), max_digits=10, decimal_places=3)
    quantity_change = models.DecimalField(_('quantity change'), max_digits=10, decimal_places=3)
    quantity_after = models.DecimalField(_('quantity after'), max_digits=10, decimal_places=3)
    reason = models.CharField(
        _('reason'),
        max_length=20,
        choices=StockMovementReason.choices
    )
    reference_id = models.CharField(_('reference ID'), max_length=50, blank=True, help_text=_('Order ID, PO number, etc.'))
    notes = models.TextField(_('notes'), blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='stock_movements',
        verbose_name=_('created by')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        db_table = 'inventory_stockmovement'
        verbose_name = _('stock movement')
        verbose_name_plural = _('stock movements')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ingredient', '-created_at']),
            models.Index(fields=['reason']),
            models.Index(fields=['created_by']),
        ]

    def __str__(self):
        sign = '+' if self.quantity_change >= 0 else ''
        return f"{self.ingredient.name}: {sign}{self.quantity_change} {self.ingredient.unit} ({self.get_reason_display()})"