/**
 * DashboardService
 * Calls real Django API endpoints for dashboard data.
 */
import { apiGet } from '../utils/api.js';

export default class DashboardService {
    async fetchDashboardData() {
        try {
            // Try the full endpoint first (all data in one call)
            const data = await apiGet('/dashboard/full/');
            return this.transformData(data);
        } catch (error) {
            console.warn('[Dashboard] Full endpoint failed, falling back to individual calls:', error);
            // Fallback to individual endpoint calls
            return this.fetchIndividualEndpoints();
        }
    }

    async fetchIndividualEndpoints() {
        const [metrics, salesOverview, topSelling, recentOrders, lowStock] = await Promise.all([
            apiGet('/dashboard/metrics/'),
            apiGet('/dashboard/sales_overview/?days=7'),
            apiGet('/dashboard/top_selling/?limit=5'),
            apiGet('/dashboard/recent_orders/?limit=5'),
            apiGet('/dashboard/low_stock/'),
        ]);

        return this.transformData({
            metrics,
            sales_overview: salesOverview,
            top_selling: topSelling,
            recent_orders: recentOrders,
            low_stock: lowStock,
        });
    }

    // Helper to parse peso-formatted string to number
    parsePesoString(str) {
        if (typeof str === 'number') return str;
        if (!str) return 0;
        // Remove ₱, commas, spaces
        return parseFloat(str.replace(/[₱,\s]/g, '')) || 0;
    }

    transformData(apiData) {
        const metrics = apiData.metrics || {};
        const salesOverview = apiData.sales_overview || {};
        const topSelling = apiData.top_selling || [];
        const recentOrders = apiData.recent_orders || [];
        const lowStock = apiData.low_stock || [];

        // Transform sales overview to match controller expectations
        const transformedSalesOverview = this.transformSalesOverview(salesOverview);

        // Transform top selling to match controller expectations
        const transformedTopSelling = this.transformTopSelling(topSelling);

        // Transform recent orders (already in correct format, just ensure)
        const transformedRecentOrders = recentOrders.map((order, index) => ({
            id: order.id || index + 1,
            orderId: order.order_number || order.id || `#${index + 1}`,
            items: order.items_summary || 'N/A',
            price: order.total_amount || '₱0.00',
            status: order.status || 'Pending',
            date: order.created_at ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        }));

        // Transform low stock
        const transformedLowStock = lowStock.map((item, index) => ({
            ingredient: item.ingredient || 'Unknown',
            quantity: item.quantity ?? 0,
            unit: item.unit || '',
            status: item.status || 'Low Stock',
        }));

        // Parse revenue strings to numbers
        const todayRevenueNum = this.parsePesoString(metrics.today_revenue);
        const totalSalesNum = this.parsePesoString(metrics.total_sales);

        return {
            metrics: {
                totalSales: metrics.total_sales || '₱0.00',
                totalOrders: metrics.total_orders ?? 0,
                lowStockCount: metrics.low_stock_count ?? 0,
                totalCustomers: metrics.total_customers ?? 0,
                // Additional fields for Quick Stats box
                todayOrders: metrics.today_orders ?? 0,
                todayRevenue: todayRevenueNum,
                completedOrdersToday: metrics.completed_orders_today ?? 0,
                pendingOrdersToday: metrics.pending_orders_today ?? 0,
                totalMenuItems: metrics.total_menu_items ?? 0,
            },
            salesOverview: transformedSalesOverview,
            topSellingItems: transformedTopSelling,
            recentOrders: transformedRecentOrders,
            lowStockItems: transformedLowStock,
        };
    }

    transformSalesOverview(salesOverview) {
        const labels = salesOverview.labels || [];
        const values = salesOverview.values || [];

        return labels.map((label, index) => ({
            date: label,
            amount: values[index] ?? 0,
            // height will be calculated by the controller
        }));
    }

    transformTopSelling(topSelling) {
        if (!Array.isArray(topSelling) || topSelling.length === 0) {
            return [];
        }

        return topSelling.map(item => ({
            rank: item.rank || '1.',
            name: item.name || 'Unknown',
            percentage: item.percentage || '0%',
            totalSold: item.total_sold ?? 0,
            revenue: item.revenue || '₱0.00',
        }));
    }

    async fetchOrderById(orderId) {
        try {
            const response = await apiGet(`/orders/orders/${orderId}/`);
            return response;
        } catch (error) {
            console.error('[DashboardService] Failed to fetch order by ID:', error);
            throw error;
        }
    }
}