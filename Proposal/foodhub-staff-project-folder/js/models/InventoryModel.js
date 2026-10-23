/* =========================================================
   INGREDIENT MODEL
   ========================================================= */

export class IngredientModel {

    constructor(data = {}) {

        this.id =
            data.id ||
            `ING-${Math.floor(
                1000 + Math.random() * 9000
            )}`;

        this.name =
            data.name || '';

        this.category =
            data.category || 'General';

        this.quantity =
            data.quantity !== undefined
                ? Number(data.quantity)
                : 0;

        this.unit =
            data.unit || 'kg';

        this.reorderLevel =
            data.reorderLevel !== undefined
                ? Number(data.reorderLevel)
                : 2;

        /*
         * Daily Usage is a classification:
         *
         * High
         * Medium
         * Low
         *
         * Do NOT convert this to Number().
         */

        this.dailyUsage =
            data.dailyUsage || 'Low';

        /*
         * Prevent invalid numbers.
         */

        if (Number.isNaN(this.quantity)) {
            this.quantity = 0;
        }

        if (Number.isNaN(this.reorderLevel)) {
            this.reorderLevel = 2;
        }

        /*
         * Automatically determine stock status.
         */

        this.status =
            this.determineStatus();
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