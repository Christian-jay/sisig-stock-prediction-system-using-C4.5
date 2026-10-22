/**
 * Dashboard Data Entities
 * Structure definitions for statistics, orders, and products.
 */
export class DashboardMetrics {
    constructor(totalSales, totalOrders, lowStockCount, totalCustomers) {
        this.totalSales = totalSales;
        this.totalOrders = totalOrders;
        this.lowStockCount = lowStockCount;
        this.totalCustomers = totalCustomers;
    }
}

export class OrderItem {
    constructor(id, orderId, items, totalPrice, status, date) {
        this.id = id;
        this.orderId = orderId;
        this.items = items;
        this.totalPrice = totalPrice;
        this.status = status;
        this.date = date;
    }
}