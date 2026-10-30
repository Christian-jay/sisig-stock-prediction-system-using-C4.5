import { apiGet } from '../utils/api.js';

export class DashboardService {
    async getDashboardData() {
        const results = await Promise.allSettled([
            this.fetchMetrics(),
            this.fetchRecentOrders(),
            this.fetchTopSelling(),
            this.fetchLowStock()
        ]);

        const [
            metricsResult,
            recentOrdersResult,
            topSellingResult,
            lowStockResult
        ] = results;

        // Debug: log each endpoint result
        console.group('[DashboardService] API Results');
        console.log('Metrics:', metricsResult);
        console.log('Recent Orders:', recentOrdersResult);
        console.log('Top Selling:', topSellingResult);
        console.log('Low Stock:', lowStockResult);
        console.groupEnd();

        const data = {
            metrics: metricsResult.status === 'fulfilled' ? metricsResult.value : this.getDefaultMetrics(),
            recentOrders: recentOrdersResult.status === 'fulfilled' ? recentOrdersResult.value : [],
            topSelling: topSellingResult.status === 'fulfilled' ? topSellingResult.value : [],
            lowStock: lowStockResult.status === 'fulfilled' ? lowStockResult.value : []
        };

        console.log('[DashboardService] Normalized data:', data);
        return data;
    }

    async fetchMetrics() {
        const response = await apiGet('/dashboard/metrics/');
        console.log('[DashboardService] fetchMetrics response:', response);
        return response;
    }

    async fetchRecentOrders() {
        const response = await apiGet('/dashboard/recent_orders/?limit=5');
        console.log('[DashboardService] fetchRecentOrders response:', response);
        return response;
    }

    async fetchTopSelling() {
        const response = await apiGet('/dashboard/top_selling/?limit=5');
        console.log('[DashboardService] fetchTopSelling response:', response);
        return response;
    }

    async fetchLowStock() {
        const response = await apiGet('/dashboard/low_stock/');
        console.log('[DashboardService] fetchLowStock response:', response);
        return response;
    }

    getDefaultMetrics() {
        return {
            today_revenue: '₱0.00',
            today_orders: 0,
            pending_orders_today: 0,
            low_stock_count: 0,
            out_of_stock_count: 0
        };
    }
}