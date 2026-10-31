import { InventoryModel, IngredientModel } from '../models/InventoryModel.js';
import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api.js';

export class InventoryService {

    constructor() {
        this.ingredientsCache = null;
        this.cacheTimestamp = null;
        this.cacheDuration = 30000; // 30 seconds cache
    }

    /* =========================================================
       FETCH INGREDIENTS FROM BACKEND API
       ========================================================= */

    async fetchIngredientsFromAPI() {
        try {
            // Check cache
            if (this.ingredientsCache && this.cacheTimestamp &&
                Date.now() - this.cacheTimestamp < this.cacheDuration) {
                return this.ingredientsCache;
            }

            // Fetch all ingredients with large page_size to avoid pagination
            const response = await apiGet('/inventory/ingredients/?page_size=2000&ordering=-created_at');
            const ingredients = response.results || response;

            console.log('[InventoryService] Fetched ingredients:', ingredients.length);

            // Transform backend data to frontend model format
            const transformed = ingredients.map(item => this.transformIngredientFromAPI(item));

            this.ingredientsCache = transformed;
            this.cacheTimestamp = Date.now();
            return transformed;
        } catch (error) {
            console.error('Failed to fetch ingredients from API:', error);
            // Return cached data if available, otherwise empty array
            return this.ingredientsCache || [];
        }
    }

    // Normalize status from backend format (IN STOCK, LOW STOCK, OUT OF STOCK)
    // to frontend format (In Stock, Low Stock, Out of Stock)
    normalizeStatus(status) {
        if (!status) return 'Out of Stock';
        const s = String(status).toUpperCase().trim();
        if (s === 'IN STOCK') return 'In Stock';
        if (s === 'LOW STOCK') return 'Low Stock';
        if (s === 'OUT OF STOCK') return 'Out of Stock';
        // Already in title case or unknown - return as-is
        return status;
    }

    transformIngredientFromAPI(apiItem) {
        const rawStatus = apiItem.status_display || apiItem.status;
        return {
            id: String(apiItem.id),
            name: apiItem.name,
            category: apiItem.category_display || apiItem.category,
            quantity: Number(apiItem.quantity),
            unit: apiItem.unit_display || apiItem.unit,
            reorderLevel: Number(apiItem.reorder_level),
            unitPrice: Number(apiItem.unit_price),
            dailyUsage: apiItem.daily_usage_display || apiItem.daily_usage,
            description: apiItem.description,
            isActive: apiItem.is_active,
            status: this.normalizeStatus(rawStatus),
            totalValue: Number(apiItem.total_value || 0),
            createdAt: apiItem.created_at,
            updatedAt: apiItem.updated_at,
            createdBy: apiItem.created_by_name || apiItem.created_by,
            recentMovements: apiItem.recent_movements || []
        };
    }

    /* =========================================================
       GET ALL INGREDIENTS
       ========================================================= */

    async getIngredients() {
        return await this.fetchIngredientsFromAPI();
    }

    /* =========================================================
       DASHBOARD DATA
       ========================================================= */

    async getDashboardData() {
        try {
            // Try to get summary from API first
            const summaryResponse = await apiGet('/inventory/ingredients/summary/');
            const summary = summaryResponse.data || summaryResponse;

            const ingredients = await this.getIngredients();

            const inStockCount = ingredients.filter(item => item.status === 'In Stock').length;
            const lowStockCount = ingredients.filter(item => item.status === 'Low Stock').length;
            const outOfStockCount = ingredients.filter(item => item.status === 'Out of Stock').length;
            const totalIngredients = ingredients.length;

            const lowStockIngredients = ingredients.filter(
                item => item.status === 'Low Stock' || item.status === 'Out of Stock'
            );

            const totalStockValue = ingredients.reduce(
                (sum, item) => sum + (item.quantity * item.unitPrice), 0
            );

            return new InventoryModel({
                totalIngredients,
                inStockCount,
                lowStockCount,
                outOfStockCount,
                totalStockValue,
                ingredients,
                lowStockIngredients
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data, falling back to computed:', error);

            // Fallback to computing from ingredients list
            const ingredients = await this.getIngredients();

            const inStockCount = ingredients.filter(item => item.status === 'In Stock').length;
            const lowStockCount = ingredients.filter(item => item.status === 'Low Stock').length;
            const outOfStockCount = ingredients.filter(item => item.status === 'Out of Stock').length;
            const totalIngredients = ingredients.length;

            const lowStockIngredients = ingredients.filter(
                item => item.status === 'Low Stock' || item.status === 'Out of Stock'
            );

            const totalStockValue = ingredients.reduce(
                (sum, item) => sum + (item.quantity * item.unitPrice), 0
            );

            return new InventoryModel({
                totalIngredients,
                inStockCount,
                lowStockCount,
                outOfStockCount,
                totalStockValue,
                ingredients,
                lowStockIngredients
            });
        }
    }

    /* =========================================================
       UPDATE INGREDIENT (adjust stock)
       ========================================================= */

    async updateIngredient(id, newQuantity) {
        try {
            const ingredients = await this.getIngredients();
            const ingredient = ingredients.find(item => String(item.id) === String(id));

            if (!ingredient) {
                return false;
            }

            const quantity = Number(newQuantity);
            if (Number.isNaN(quantity) || quantity < 0) {
                return false;
            }

            // Calculate quantity change
            const quantityChange = quantity - ingredient.quantity;

            if (quantityChange === 0) {
                return true; // No change needed
            }

            // Determine reason based on change direction
            const reason = quantityChange > 0 ? 'RESTOCK' : 'ADJUSTMENT';

            // Call backend adjust_stock endpoint
            const response = await apiPost(`/inventory/ingredients/${id}/adjust_stock/`, {
                quantity_change: quantityChange,
                reason: reason,
                notes: 'Manual adjustment from inventory page'
            });

            if (response.success) {
                // Invalidate cache
                this.ingredientsCache = null;
                this.cacheTimestamp = null;
                return true;
            }

            return false;
        } catch (error) {
            console.error('Failed to update ingredient:', error);
            return false;
        }
    }

    /* =========================================================
       DELETE INGREDIENT
       ========================================================= */

    async deleteIngredient(id) {
        try {
            const response = await apiDelete(`/inventory/ingredients/${id}/`);

            // Invalidate cache
            this.ingredientsCache = null;
            this.cacheTimestamp = null;

            return response !== null; // 204 returns null
        } catch (error) {
            console.error('Failed to delete ingredient:', error);
            return false;
        }
    }

    /* =========================================================
       CREATE INGREDIENT (Admin only)
       ========================================================= */

    async createIngredient(data) {
        try {
            const response = await apiPost('/inventory/ingredients/', data);

            // Invalidate cache
            this.ingredientsCache = null;
            this.cacheTimestamp = null;

            return this.transformIngredientFromAPI(response);
        } catch (error) {
            console.error('Failed to create ingredient:', error);
            throw error;
        }
    }

    /* =========================================================
       GET CATEGORIES, UNITS, DAILY USAGE LEVELS
       ========================================================= */

    async getCategories() {
        try {
            const response = await apiGet('/inventory/ingredients/categories/');
            return response.data || response;
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            return [];
        }
    }

    async getUnits() {
        try {
            const response = await apiGet('/inventory/ingredients/units/');
            return response.data || response;
        } catch (error) {
            console.error('Failed to fetch units:', error);
            return [];
        }
    }

    async getDailyUsageLevels() {
        try {
            const response = await apiGet('/inventory/ingredients/daily_usage_levels/');
            return response.data || response;
        } catch (error) {
            console.error('Failed to fetch daily usage levels:', error);
            return [];
        }
    }

    /* =========================================================
       GET STOCK MOVEMENTS
       ========================================================= */

    async getStockMovements(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const endpoint = `/inventory/movements/${queryString ? '?' + queryString : ''}`;
            const response = await apiGet(endpoint);
            return response.results || response;
        } catch (error) {
            console.error('Failed to fetch stock movements:', error);
            return [];
        }
    }

    /* =========================================================
       CLEAR CACHE
       ========================================================= */

    clearCache() {
        this.ingredientsCache = null;
        this.cacheTimestamp = null;
    }
}