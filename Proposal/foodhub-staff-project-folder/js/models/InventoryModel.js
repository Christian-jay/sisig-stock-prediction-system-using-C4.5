/* =========================================================
   INGREDIENT MODEL
   ========================================================= */

export class IngredientModel {

    constructor(data = {}) {

        // Handle both API response format and local format
        this.id =
            data.id ||
            `ING-${Math.floor(
                1000 + Math.random() * 9000
            )}`;

        this.name =
            data.name || '';

        // Category: API returns category_display, local returns category
        this.category =
            data.category_display || data.category || 'General';

        // Quantity: API returns as string/number, ensure number
        this.quantity =
            data.quantity !== undefined
                ? Number(data.quantity)
                : 0;

        // Unit: API returns unit_display, local returns unit
        this.unit =
            data.unit_display || data.unit || 'kg';

        // Reorder level: API returns reorder_level, local returns reorderLevel
        this.reorderLevel =
            data.reorder_level !== undefined
                ? Number(data.reorder_level)
                : (data.reorderLevel !== undefined ? Number(data.reorderLevel) : 2);

        // Unit price: API returns unit_price, local returns unitPrice
        this.unitPrice =
            data.unit_price !== undefined
                ? Number(data.unit_price)
                : (data.unitPrice !== undefined ? Number(data.unitPrice) : 0);

        // Daily usage: API returns daily_usage_display, local returns dailyUsage
        this.dailyUsage =
            data.daily_usage_display || data.dailyUsage || 'Low';

        this.description =
            data.description || '';

        this.isActive =
            data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true);

        this.status =
            data.status_display || data.status || this.determineStatus();

        this.totalValue =
            data.total_value !== undefined
                ? Number(data.total_value)
                : (data.totalValue !== undefined ? Number(data.totalValue) : this.quantity * this.unitPrice);

        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
        this.createdBy = data.created_by_name || data.createdBy;
        this.recentMovements = data.recent_movements || data.recentMovements || [];

        /*
         * Prevent invalid numbers.
         */

        if (Number.isNaN(this.quantity)) {
            this.quantity = 0;
        }

        if (Number.isNaN(this.reorderLevel)) {
            this.reorderLevel = 2;
        }

        if (Number.isNaN(this.unitPrice)) {
            this.unitPrice = 0;
        }
    }

    /* =========================================================
       STATUS
       ========================================================= */

    determineStatus() {

        if (this.quantity <= 0) {
            return 'Out of Stock';
        }

        if (
            this.quantity <=
            this.reorderLevel
        ) {
            return 'Low Stock';
        }

        return 'In Stock';
    }

    /* =========================================================
       TO API FORMAT (for creating/updating)
       ========================================================= */

    toAPIFormat() {
        return {
            name: this.name,
            category: this.category,
            quantity: this.quantity,
            unit: this.unit,
            reorder_level: this.reorderLevel,
            unit_price: this.unitPrice,
            daily_usage: this.dailyUsage,
            description: this.description,
            is_active: this.isActive
        };
    }
}


/* =========================================================
   INVENTORY MODEL
   ========================================================= */

export class InventoryModel {

    constructor(data = {}) {

        this.totalIngredients =
            Number(data.totalIngredients) || 0;

        this.inStockCount =
            Number(data.inStockCount) || 0;

        this.lowStockCount =
            Number(data.lowStockCount) || 0;

        this.outOfStockCount =
            Number(data.outOfStockCount) || 0;

        this.totalStockValue =
            Number(data.totalStockValue) || 0;

        this.ingredients =
            Array.isArray(data.ingredients)
                ? data.ingredients.map(
                    item =>
                        item instanceof IngredientModel
                            ? item
                            : new IngredientModel(item)
                )
                : [];

        this.lowStockIngredients =
            Array.isArray(data.lowStockIngredients)
                ? data.lowStockIngredients.map(
                    item =>
                        item instanceof IngredientModel
                            ? item
                            : new IngredientModel(item)
                )
                : [];
    }
}