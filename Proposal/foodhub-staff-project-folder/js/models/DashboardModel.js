export class DashboardModel {
    constructor(data) {
        this.orders = data.orders || [];
        this.popularItems = data.popularItems || [];
        this.lowStockIngredients = data.lowStockIngredients || [];
    }
}