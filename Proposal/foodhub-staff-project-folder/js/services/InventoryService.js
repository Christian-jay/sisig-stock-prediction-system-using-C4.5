import {
    InventoryModel,
    IngredientModel
} from '../models/InventoryModel.js';


export class InventoryService {

    constructor() {

        this.storageKey =
            'foodhub_inventory';

        this.initializeInventory();
    }

    /* =========================================================
       INITIAL DATA
       ========================================================= */

    initializeInventory() {

        const existingData =
            localStorage.getItem(
                this.storageKey
            );

        /*
         * Do not overwrite existing inventory.
         */

        if (existingData) {
            return;
        }

        const rawIngredients = [

            {
                id: '1',
                name: 'Toyo (Soy Sauce)',
                category: 'Condiments',
                quantity: 0,
                unit: 'L',
                reorderLevel: 5,
                dailyUsage: 'High',
                unitPrice: 85
            },

            {
                id: '2',
                name: 'Mayo',
                category: 'Condiments',
                quantity: 2,
                unit: 'kg',
                reorderLevel: 3,
                dailyUsage: 'Medium',
                unitPrice: 120
            },

            {
                id: '3',
                name: 'Egg',
                category: 'Poultry',
                quantity: 25,
                unit: 'pcs',
                reorderLevel: 10,
                dailyUsage: 'High',
                unitPrice: 10
            },

            {
                id: '4',
                name: 'Pork Maskara',
                category: 'Meat',
                quantity: 15,
                unit: 'kg',
                reorderLevel: 5,
                dailyUsage: 'High',
                unitPrice: 280
            },

            {
                id: '5',
                name: 'Sili Green',
                category: 'Vegetables',
                quantity: 1,
                unit: 'kg',
                reorderLevel: 2,
                dailyUsage: 'Low',
                unitPrice: 180
            },

            {
                id: '6',
                name: 'Sibuyas (Red Onion)',
                category: 'Vegetables',
                quantity: 8,
                unit: 'kg',
                reorderLevel: 3,
                dailyUsage: 'Medium',
                unitPrice: 150
            },

            {
                id: '7',
                name: 'Kalamansi',
                category: 'Vegetables',
                quantity: 4,
                unit: 'kg',
                reorderLevel: 2,
                dailyUsage: 'Low',
                unitPrice: 100
            },

            {
                id: '8',
                name: 'Calamansi Extract',
                category: 'Beverages',
                quantity: 0,
                unit: 'L',
                reorderLevel: 2,
                dailyUsage: 'Medium',
                unitPrice: 160
            },

            {
                id: '9',
                name: 'Black Pepper',
                category: 'Spices',
                quantity: 3,
                unit: 'kg',
                reorderLevel: 1,
                dailyUsage: 'Low',
                unitPrice: 450
            },

            {
                id: '10',
                name: 'Butter / Margarine',
                category: 'Dairy',
                quantity: 6,
                unit: 'kg',
                reorderLevel: 2,
                dailyUsage: 'Medium',
                unitPrice: 240
            },

            {
                id: '11',
                name: 'Garlic',
                category: 'Vegetables',
                quantity: 5,
                unit: 'kg',
                reorderLevel: 2,
                dailyUsage: 'Medium',
                unitPrice: 220
            },

            {
                id: '12',
                name: 'Liver Spread',
                category: 'Condiments',
                quantity: 1,
                unit: 'cans',
                reorderLevel: 4,
                dailyUsage: 'Low',
                unitPrice: 55
            }
        ];

        localStorage.setItem(
            this.storageKey,
            JSON.stringify(rawIngredients)
        );
    }

    /* =========================================================
       GET ALL INGREDIENTS
       ========================================================= */

    getIngredients() {

        let rawData = [];

        try {

            rawData =
                JSON.parse(
                    localStorage.getItem(
                        this.storageKey
                    )
                ) || [];

        } catch (error) {

            console.error(
                'Unable to read inventory:',
                error
            );

            rawData = [];
        }

        return rawData.map(
            item =>
                new IngredientModel(item)
        );
    }

    /* =========================================================
       DASHBOARD DATA
       ========================================================= */

    getDashboardData() {

        const ingredients =
            this.getIngredients();

        const inStockCount =
            ingredients.filter(
                item =>
                    item.status === 'In Stock'
            ).length;

        const lowStockCount =
            ingredients.filter(
                item =>
                    item.status === 'Low Stock'
            ).length;

        const outOfStockCount =
            ingredients.filter(
                item =>
                    item.status === 'Out of Stock'
            ).length;

        const totalIngredients =
            ingredients.length;

        /*
         * Low-stock monitoring includes:
         *
         * Low Stock
         * Out of Stock
         */

        const lowStockIngredients =
            ingredients.filter(
                item =>
                    item.status === 'Low Stock' ||
                    item.status === 'Out of Stock'
            );

        /*
         * Calculate actual inventory value.
         *
         * quantity × unitPrice
         */

        const totalStockValue =
            ingredients.reduce(
                (sum, item) => {

                    const unitPrice =
                        Number(item.unitPrice) || 0;

                    return (
                        sum +
                        (
                            item.quantity *
                            unitPrice
                        )
                    );

                },
                0
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

    /* =========================================================
       UPDATE INGREDIENT
       ========================================================= */

    updateIngredient(
        id,
        newQuantity
    ) {

        const ingredients =
            this.getRawIngredients();

        const ingredient =
            ingredients.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (!ingredient) {
            return false;
        }

        const quantity =
            Number(newQuantity);

        if (
            Number.isNaN(quantity) ||
            quantity < 0
        ) {
            return false;
        }

        ingredient.quantity =
            quantity;

        this.saveRawIngredients(
            ingredients
        );

        return true;
    }

    /* =========================================================
       DELETE INGREDIENT
       ========================================================= */

    deleteIngredient(id) {

        const ingredients =
            this.getRawIngredients();

        const originalLength =
            ingredients.length;

        const filteredIngredients =
            ingredients.filter(
                item =>
                    String(item.id) !==
                    String(id)
            );

        if (
            filteredIngredients.length ===
            originalLength
        ) {
            return false;
        }

        this.saveRawIngredients(
            filteredIngredients
        );

        return true;
    }

    /* =========================================================
       RAW LOCAL STORAGE DATA
       ========================================================= */

    getRawIngredients() {

        try {

            return (
                JSON.parse(
                    localStorage.getItem(
                        this.storageKey
                    )
                ) || []
            );

        } catch (error) {

            console.error(
                'Unable to read raw inventory:',
                error
            );

            return [];
        }
    }

    /* =========================================================
       SAVE LOCAL STORAGE DATA
       ========================================================= */

    saveRawIngredients(
        ingredients
    ) {

        localStorage.setItem(
            this.storageKey,
            JSON.stringify(
                ingredients
            )
        );
    }
}