"""
Inventory admin - Admin interface for Ingredient and StockMovement models.
"""
from django.contrib import admin
from .models import Ingredient, StockMovement


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'quantity', 'unit', 'reorder_level', 'unit_price', 'daily_usage', 'is_active', 'status', 'created_at']
    list_filter = ['category', 'is_active', 'daily_usage', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'status', 'total_value']
    list_editable = ['is_active', 'reorder_level']
    ordering = ['category', 'name']
    list_per_page = 25

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'description')
        }),
        ('Stock Details', {
            'fields': ('quantity', 'unit', 'reorder_level', 'unit_price', 'daily_usage', 'is_active')
        }),
        ('System Fields', {
            'fields': ('status', 'total_value', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['ingredient', 'quantity_before', 'quantity_change', 'quantity_after', 'reason', 'reference_id', 'created_by', 'created_at']
    list_filter = ['reason', 'created_at', 'created_by']
    search_fields = ['ingredient__name', 'reference_id', 'notes']
    readonly_fields = ['ingredient', 'quantity_before', 'quantity_change', 'quantity_after', 'reason', 'reference_id', 'notes', 'created_by', 'created_at']
    ordering = ['-created_at']
    list_per_page = 50
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False  # Stock movements are created via API, not admin

    def has_change_permission(self, request, obj=None):
        return False  # Stock movements are immutable audit logs