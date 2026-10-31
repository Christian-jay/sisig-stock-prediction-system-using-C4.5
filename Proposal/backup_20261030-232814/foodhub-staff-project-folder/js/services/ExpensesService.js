import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api.js';
import { ExpensesSummaryModel, ExpenseRecordModel, ReplenishIngredientModel } from '../models/ExpensesModel.js';

/**
 * Category label to value mapping for API calls
 * Backend expects uppercase values: SUPPLIES, UTILITIES, OTHERS, INGREDIENTS
 */
const CATEGORY_LABEL_TO_VALUE = {
    'Supplies': 'SUPPLIES',
    'Utilities': 'UTILITIES',
    'Others': 'OTHERS',
    'Ingredients': 'INGREDIENTS'
};

const CATEGORY_VALUE_TO_LABEL = {
    'SUPPLIES': 'Supplies',
    'UTILITIES': 'Utilities',
    'OTHERS': 'Others',
    'INGREDIENTS': 'Ingredients'
};

export class ExpensesService {
    /**
     * Fetch expenses data from the backend API.
     * Supports server-side filtering and pagination.
     *
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.page_size - Number of records per page
     * @param {string} params.search - Search term for description
     * @param {string} params.category - Category filter (All, Supplies, Utilities, Others, Ingredients) - LABEL format
     * @param {string} params.ordering - Ordering field (e.g., -date, -created_at)
     */
    async getExpensesData(params = {}) {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append('page', params.page);
        if (params.page_size) queryParams.append('page_size', params.page_size);
        if (params.search) queryParams.append('search', params.search);
        if (params.category && params.category !== 'All') {
            // Convert label to value for backend
            const categoryValue = CATEGORY_LABEL_TO_VALUE[params.category] || params.category;
            queryParams.append('category', categoryValue);
        }
        if (params.ordering) queryParams.append('ordering', params.ordering);

        const endpoint = `/expenses/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await apiGet(endpoint);

        // Backend returns paginated response with results array
        const expenseRecords = (response.results || []).map(item => new ExpenseRecordModel({
            id: item.id,
            timestamp: item.date, // Backend uses 'date' field
            description: item.description,
            category: CATEGORY_VALUE_TO_LABEL[item.category] || item.category, // Convert value to label for display
            amount: item.amount
        }));

        return {
            results: expenseRecords,
            count: response.count,
            next: response.next,
            previous: response.previous,
            page: params.page || 1,
            page_size: params.page_size || 20
        };
    }

    /**
     * Fetch expenses summary statistics from the backend API.
     * No date filtering - shows all expenses summary.
     */
    async getExpensesSummary() {
        const response = await apiGet('/expenses/summary/');

        return {
            totalExpenses: response.total_expenses || 0,
            totalTransactions: response.total_records || 0,
            highestCategoryName: response.highest_category?.category_display || 'N/A',
            highestCategoryAmount: response.highest_category?.total || 0,
            averageExpense: response.average_expense || 0
        };
    }

    /**
     * Fetch available expense categories from the backend API.
     * Returns array of { value, label } objects.
     */
    async getCategories() {
        const response = await apiGet('/expenses/categories/');
        // Backend returns array of { value: "SUPPLIES", label: "Supplies" }
        return response;
    }

    /**
     * Fetch a single expense by ID.
     *
     * @param {number} id - Expense ID
     */
    async getExpense(id) {
        const response = await apiGet(`/expenses/${id}/`);
        return new ExpenseRecordModel({
            id: response.id,
            timestamp: response.date,
            description: response.description,
            category: CATEGORY_VALUE_TO_LABEL[response.category] || response.category,
            amount: response.amount,
            createdAt: response.created_at,
            updatedAt: response.updated_at
        });
    }

    /**
     * Create a new expense record.
     *
     * @param {Object} expenseData - Expense data
     * @param {string} expenseData.description - Expense description
     * @param {string} expenseData.category - Category (SUPPLIES, UTILITIES, OTHERS, INGREDIENTS)
     * @param {number} expenseData.amount - Amount
     * @param {string} expenseData.date - Date in YYYY-MM-DD format
     */
    async createExpense(expenseData) {
        const response = await apiPost('/expenses/', {
            description: expenseData.description,
            category: expenseData.category,
            amount: expenseData.amount,
            date: expenseData.date
        });

        return new ExpenseRecordModel({
            id: response.id,
            timestamp: response.date,
            description: response.description,
            category: CATEGORY_VALUE_TO_LABEL[response.category] || response.category,
            amount: response.amount
        });
    }

    /**
     * Update an existing expense record.
     *
     * @param {number} id - Expense ID
     * @param {Object} expenseData - Updated expense data
     */
    async updateExpense(id, expenseData) {
        const response = await apiPatch(`/expenses/${id}/`, expenseData);

        return new ExpenseRecordModel({
            id: response.id,
            timestamp: response.date,
            description: response.description,
            category: CATEGORY_VALUE_TO_LABEL[response.category] || response.category,
            amount: response.amount
        });
    }

    /**
     * Delete an expense record.
     *
     * @param {number} id - Expense ID
     */
    async deleteExpense(id) {
        await apiDelete(`/expenses/${id}/`);
        return true;
    }

    /**
     * Fetch low stock ingredients (for replenishment section).
     * This could come from inventory API in the future.
     */
    async getLowStockIngredients() {
        // For now, return empty array - can be connected to inventory API later
        return [];
    }
}