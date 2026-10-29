import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api.js';

/**
 * InventoryService
 * Handles all inventory-related API communication.
 * Replaces previous mock data with Django REST API integration.
 */
export class InventoryService {
    constructor() {
        // Cache for categories/units to avoid repeated fetches
        this._categoriesCache = null;
        this._unitsCache = null;
    }

    /**
     * Fetch all ingredients with optional query parameters
     * @param {Object} params - Query parameters (page, page_size, search, category, status, etc.)
     * @returns {Promise<Object>} Paginated response with results array
     */
    async getIngredients(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/inventory/ingredients/${queryString ? `?${queryString}` : ''}`;
        return apiGet(endpoint);
    }

    /**
     * Fetch inventory summary statistics
     * @returns {Promise<Object>} Summary with total_items, in_stock, low_stock, out_of_stock, total_value
     */
    async getSummary() {
        return apiGet('/inventory/ingredients/summary/');
    }

    /**
     * Fetch low stock and out of stock ingredients
     * @returns {Promise<Object>} { out_of_stock: [...], low_stock: [...] }
     */
    async getLowStock() {
        return apiGet('/inventory/ingredients/low_stock/');
    }

    /**
     * Fetch available ingredient categories
     * @returns {Promise<Array>} Array of { value, label } objects
     */
    async getCategories() {
        if (this._categoriesCache) {
            return this._categoriesCache;
        }
        const data = await apiGet('/inventory/ingredients/categories/');
        this._categoriesCache = data;
        return data;
    }

    /**
     * Fetch available units of measure
     * @returns {Promise<Array>} Array of { value, label } objects
     */
    async getUnits() {
        if (this._unitsCache) {
            return this._unitsCache;
        }
        const data = await apiGet('/inventory/ingredients/units/');
        this._unitsCache = data;
        return data;
    }

    /**
     * Clear cached categories/units (call after CRUD operations in future phases)
     */
    clearCache() {
        this._categoriesCache = null;
        this._unitsCache = null;
    }

    /**
     * Create a new ingredient
     * @param {Object} data - Ingredient data
     * @returns {Promise<Object>} Created ingredient
     */
    async createIngredient(data) {
        const response = await apiPost('/inventory/ingredients/', data);
        this.clearCache();
        return response;
    }

    /**
     * Update an existing ingredient
     * @param {number|string} id - Ingredient ID
     * @param {Object} data - Ingredient data to update
     * @returns {Promise<Object>} Updated ingredient
     */
    async updateIngredient(id, data) {
        const response = await apiPatch(`/inventory/ingredients/${id}/`, data);
        this.clearCache();
        return response;
    }

    /**
     * Delete an ingredient
     * @param {number|string} id - Ingredient ID
     * @returns {Promise<void>}
     */
    async deleteIngredient(id) {
        await apiDelete(`/inventory/ingredients/${id}/`);
        this.clearCache();
    }

    /**
     * Adjust stock for an ingredient (uses custom adjust_stock action)
     * @param {number|string} id - Ingredient ID
     * @param {Object} data - { quantity_change: number, reason: string, reference_id?: string, notes?: string }
     * @returns {Promise<Object>} Updated ingredient with movement info
     */
    async adjustStock(id, data) {
        const response = await apiPost(`/inventory/ingredients/${id}/adjust_stock/`, data);
        this.clearCache();
        return response;
    }

    /**
     * Fetch ingredient usage/consumption history for line chart
     * @param {number} days - Number of days (7, 30, or 90)
     * @returns {Promise<Object>} { labels: [...], values: [...], total_consumption: number }
     */
    async getUsageHistory(days = 7) {
        return apiGet(`/inventory/ingredients/usage_history/?days=${days}`);
    }
}