"""
Expenses serializers - API serialization for expense records.
"""
from rest_framework import serializers
from .models import Expense, ExpenseCategory


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'description', 'category', 'category_display',
            'amount', 'date',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class ExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['description', 'category', 'amount', 'date']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value


class ExpenseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['description', 'category', 'amount', 'date']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value


class ExpenseCategorySerializer(serializers.Serializer):
    value = serializers.ChoiceField(choices=ExpenseCategory.choices)
    label = serializers.CharField(source='get_category_display', read_only=True)


class ExpenseSummarySerializer(serializers.Serializer):
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_records = serializers.IntegerField()
    highest_category = serializers.DictField(child=serializers.CharField(), allow_null=True)
    average_expense = serializers.DecimalField(max_digits=12, decimal_places=2)