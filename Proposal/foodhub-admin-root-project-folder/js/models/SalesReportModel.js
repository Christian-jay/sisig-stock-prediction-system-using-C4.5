/**
 * Sales Report Data Entities
 * Structure definitions for sales summary, trends, top selling items, and tables.
 */

export class SalesSummaryMetrics {
    constructor(totalSales, totalOrders, averageOrderValue) {
        this.totalSales = totalSales;
        this.totalOrders = totalOrders;
        this.averageOrderValue = averageOrderValue;
    }
}

export class SalesTrendItem {
    constructor(date, amount) {
        this.date = date;
        this.amount = amount;
    }
}

export class TopSellingItem {
    constructor(rank, name, quantity, sales, image) {
        this.rank = rank;
        this.name = name;
        this.quantity = quantity;
        this.sales = sales;
        this.image = image;
    }
}

export class SalesByMenuItem {
    constructor(id, name, quantity, totalSales, percentage) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
        this.totalSales = totalSales;
        this.percentage = percentage;
    }
}

export class DailySalesBreakdownItem {
    constructor(date, totalSales, orders, avgOrderValue) {
        this.date = date;
        this.totalSales = totalSales;
        this.orders = orders;
        this.avgOrderValue = avgOrderValue;
    }
}