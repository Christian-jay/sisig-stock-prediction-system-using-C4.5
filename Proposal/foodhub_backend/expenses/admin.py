"""
Expenses admin - Admin configuration for expenses.
"""
from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['id', 'description', 'category', 'amount', 'date', 'created_by', 'created_at']
    list_filter = ['category', 'date', 'created_at']
    search_fields = ['description', 'created_by__username', 'created_by__email']
    ordering = ['-date', '-created_at']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        (None, {
            'fields': ('description', 'category', 'amount', 'date', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )