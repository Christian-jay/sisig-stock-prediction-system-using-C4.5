/**
 * MenuModel
 * Data structures and helper methods for Menu Items and Recipes
 */
export class MenuItem {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.category = data.category || null;
        this.price = data.price || 0;
        this.status = data.status || 'AVAILABLE';
        this.image = data.image || null;
        this.recipe_ingredients = data.recipe_ingredients || [];
    }

    // Helper to calculate total recipe cost
    get totalCost() {
        return this.recipe_ingredients.reduce((acc, ri) => {
            return acc + (ri.quantity * ri.ingredient_unit_price);
        }, 0);
    }
}
