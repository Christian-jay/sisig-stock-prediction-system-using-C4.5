export class DashboardModel {
    constructor(data = {}) {
        const metrics = data.metrics || {};
        const recentOrders = data.recentOrders || [];
        const topSelling = data.topSelling || [];
        const lowStock = data.lowStock || [];

        // Metrics
        this.todaySales = this.formatCurrency(metrics.today_revenue);
        this.ordersToday = Number(metrics.today_orders) || 0;
        this.pendingOrders = Number(metrics.pending_orders_today) || 0;
        this.lowStockCount = (Number(metrics.low_stock_count) || 0) + (Number(metrics.out_of_stock_count) || 0);

        // Orders (Today's Orders table - 5 columns)
        this.orders = recentOrders.map(order => ({
            id: order.order_number || `ORD-${order.id}`,
            item: order.items_summary || 'Unknown item',
            total: this.formatCurrency(order.total_amount),
            status: order.status || 'PENDING'
        }));

        // Popular Menu Items
        this.popularItems = topSelling.map(item => ({
            name: item.name || 'Unknown',
            count: `${item.total_sold || 0} orders`
        }));

        // Low Stock Ingredients
        this.lowStockIngredients = lowStock.map(item => ({
            name: item.ingredient || 'Unknown',
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'pcs',
            status: item.status || 'Low Stock'
        }));
    }

    formatCurrency(value) {
        if (!value) return '₱0.00';
        const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : Number(value);
        if (isNaN(num)) return '₱0.00';
        return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}