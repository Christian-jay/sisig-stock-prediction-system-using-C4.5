"""
Menu models - Menu categories, items, and recipes.
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from inventory.models import Ingredient, UnitOfMeasure


class MenuCategory(models.Model):
    """
    Menu category model (e.g., Appetizers, Main Course, Desserts, Drinks).
    """
    name = models.CharField(_('name'), max_length=100, unique=True)
    description = models.TextField(_('description'), blank=True)
    display_order = models.PositiveIntegerField(_('display order'), default=0)
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_menu_categories',
        verbose_name=_('created by')
    )

    class Meta:
        db_table = 'menu_category'
        verbose_name = _('menu category')
        verbose_name_plural = _('menu categories')
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    """
    Menu item model - represents a dish or product sold.
    """
    class ItemType(models.TextChoices):
        FOOD = 'FOOD', _('Food')
        DRINK = 'DRINK', _('Drink')
        DESSERT = 'DESSERT', _('Dessert')
        COMBO = 'COMBO', _('Combo Meal')

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', _('Available')
        UNAVAILABLE = 'UNAVAILABLE', _('Unavailable')
        DISCONTINUED = 'DISCONTINUED', _('Discontinued')
        SEASONAL = 'SEASONAL', _('Seasonal')

    name = models.CharField(_('name'), max_length=150)
    description = models.TextField(_('description'), blank=True)
    category = models.ForeignKey(
        MenuCategory,
        on_delete=models.PROTECT,
        related_name='items',
        verbose_name=_('category')
    )
    item_type = models.CharField(
        _('item type'),
        max_length=10,
        choices=ItemType.choices,
        default=ItemType.FOOD
    )
    price = models.DecimalField(_('price'), max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(_('cost price'), max_digits=10, decimal_places=2, default=0)
    image = models.ImageField(_('image'), upload_to='menu_items/', null=True, blank=True)
    is_active = models.BooleanField(_('active'), default=True)
    status = models.CharField(
        _('status'),
        max_length=15,
        choices=Status.choices,
        default=Status.AVAILABLE
    )
    preparation_time = models.PositiveIntegerField(_('preparation time (minutes)'), default=0)
    calories = models.PositiveIntegerField(_('calories'), null=True, blank=True)
    allergens = models.TextField(_('allergens'), blank=True, help_text=_('Comma-separated list of allergens'))
    is_vegetarian = models.BooleanField(_('vegetarian'), default=False)
    is_vegan = models.BooleanField(_('vegan'), default=False)
    is_gluten_free = models.BooleanField(_('gluten free'), default=False)
    display_order = models.PositiveIntegerField(_('display order'), default=0)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_menu_items',
        verbose_name=_('created by')
    )

    class Meta:
        db_table = 'menu_item'
        verbose_name = _('menu item')
        verbose_name_plural = _('menu items')
        ordering = ['category__display_order', 'display_order', 'name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.name} (₱{self.price})"

    @property
    def profit_margin(self):
        if self.price > 0:
            return ((self.price - self.cost_price) / self.price) * 100
        return 0

    @property
    def total_recipe_cost(self):
        """Calculate total cost based on recipe ingredients."""
        total = self.recipe_ingredients.aggregate(
            total=models.Sum(models.F('quantity') * models.F('ingredient__unit_price'))
        )['total']
        return total or 0

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('menuitem-detail', kwargs={'pk': self.pk})


class RecipeIngredient(models.Model):
    """
    Recipe ingredient - links menu items to inventory ingredients with quantities.
    This represents the bill of materials for a menu item.
    """
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.CASCADE,
        related_name='recipe_ingredients',
        verbose_name=_('menu item')
    )
    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.PROTECT,
        related_name='recipe_usages',
        verbose_name=_('ingredient')
    )
    quantity = models.DecimalField(_('quantity'), max_digits=10, decimal_places=3)
    unit = models.CharField(_('unit'), max_length=10, choices=UnitOfMeasure.choices)
    notes = models.TextField(_('notes'), blank=True)
    is_optional = models.BooleanField(_('optional'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        db_table = 'menu_recipe_ingredient'
        verbose_name = _('recipe ingredient')
        verbose_name_plural = _('recipe ingredients')
        unique_together = ['menu_item', 'ingredient']
        ordering = ['menu_item', 'ingredient__name']

    def __str__(self):
        return f"{self.menu_item.name} - {self.ingredient.name}: {self.quantity} {self.unit}"

    @property
    def line_cost(self):
        """Cost of this ingredient line in the recipe."""
        return self.quantity * self.ingredient.unit_price