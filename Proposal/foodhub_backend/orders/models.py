"""
Orders models - Order and OrderItem for tracking sales.
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from menu.models import MenuItem


class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending')
    PROCESSING = 'PROCESSING', _('Processing')
    COMPLETED = 'COMPLETED', _('Completed')
    CANCELLED = 'CANCELLED', _('Cancelled')


class PaymentMethod(models.TextChoices):
    CASH = 'CASH', _('Cash')
    GCASH = 'GCASH', _('GCash')
    MAYA = 'MAYA', _('Maya')
    FOODPANDA = 'FOODPANDA', _('Foodpanda')


class Order(models.Model):
    """
    Order model - represents a customer order.
    """
    order_number = models.CharField(_('order number'), max_length=20, unique=True)

    status = models.CharField(
        _('status'),
        max_length=15,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING
    )
    payment_method = models.CharField(
        _('payment method'),
        max_length=10,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH
    )
    payment_status = models.CharField(
        _('payment status'),
        max_length=15,
        choices=[
            ('UNPAID', _('Unpaid')),
            ('PAID', _('Paid')),
        ],
        default='UNPAID'
    )

    subtotal = models.DecimalField(_('subtotal'), max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(_('tax amount'), max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(_('discount amount'), max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(_('total amount'), max_digits=10, decimal_places=2, default=0)

    notes = models.TextField(_('notes'), blank=True)

    # For dine-in/takeout
    order_type = models.CharField(
        _('order type'),
        max_length=10,
        choices=[
            ('DINE_IN', _('Dine In')),
            ('TAKEOUT', _('Takeout')),
        ],
        default='DINE_IN'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_orders',
        verbose_name=_('created by')
    )
    served_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='served_orders',
        verbose_name=_('served by')
    )
    completed_at = models.DateTimeField(_('completed at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        db_table = 'orders_order'
        verbose_name = _('order')
        verbose_name_plural = _('orders')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"{self.order_number}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate order number: ORD-YYYYMMDD-XXXX
            from django.utils import timezone
            date_str = timezone.now().strftime('%Y%m%d')
            last_order = Order.objects.filter(
                order_number__startswith=f'ORD-{date_str}'
            ).order_by('-order_number').first()

            if last_order:
                try:
                    last_num = int(last_order.order_number.split('-')[-1])
                    new_num = last_num + 1
                except (ValueError, IndexError):
                    new_num = 1
            else:
                new_num = 1

            self.order_number = f'ORD-{date_str}-{new_num:04d}'

        # Calculate totals from items if not set
        if self.pk:
            self.subtotal = self.items.aggregate(
                total=models.Sum('line_total')
            )['total'] or 0
            self.total_amount = self.subtotal + self.tax_amount - self.discount_amount

        super().save(*args, **kwargs)

    @property
    def item_count(self):
        return self.items.aggregate(total=models.Sum('quantity'))['total'] or 0


class OrderItem(models.Model):
    """
    Order item - individual menu items in an order.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('order')
    )
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.PROTECT,
        related_name='order_items',
        verbose_name=_('menu item')
    )
    quantity = models.PositiveIntegerField(_('quantity'), default=1)
    unit_price = models.DecimalField(_('unit price'), max_digits=10, decimal_places=2)
    line_total = models.DecimalField(_('line total'), max_digits=10, decimal_places=2)
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        db_table = 'orders_orderitem'
        verbose_name = _('order item')
        verbose_name_plural = _('order items')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.order.order_number} - {self.menu_item.name} x{self.quantity}"

    def save(self, *args, **kwargs):
        self.unit_price = self.menu_item.price
        self.line_total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        # Update order totals
        self.order.save(update_fields=['subtotal', 'total_amount'])