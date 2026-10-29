import { OrderModel } from '../models/OrderModel.js';
import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api.js';

const ORDERS_API_BASE = '/orders/orders';
const MENU_API_BASE = '/menu/menu-items';

export class OrderService {
    async fetchOrders(page = 1, pageSize = 200, filters = {}) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: pageSize.toString(),
                ...filters
            });

            const response = await apiGet(`${ORDERS_API_BASE}/?${params.toString()}`);

            // Handle custom pagination response format
            const results = response.results || response;

            return results.map((order, index) => new OrderModel({
                id: order.id,
                orderId: order.order_number,
                totalOrders: order.items?.length || order.item_count || 0,
                status: order.status.toLowerCase(),
                date: order.created_at ? this.formatDate(order.created_at) : ''
            }));
        } catch (error) {
            console.error('[OrderService] Failed to fetch orders:', error);
            return [];
        }
    }

    async fetchMenuItems() {
        try {
            const response = await apiGet(`${MENU_API_BASE}/?page_size=100`);
            return response.results || response || [];
        } catch (error) {
            console.error('[OrderService] Failed to fetch menu items:', error);
            return [];
        }
    }

    async createOrder(orderData) {
        try {
            const response = await apiPost(`${ORDERS_API_BASE}/`, orderData);
            return response;
        } catch (error) {
            console.error('[OrderService] Failed to create order:', error);
            throw error;
        }
    }

    async fetchOrderById(orderId) {
        try {
            const response = await apiGet(`${ORDERS_API_BASE}/${orderId}/`);
            return response;
        } catch (error) {
            console.error('[OrderService] Failed to fetch order by ID:', error);
            throw error;
        }
    }

    async updateOrder(orderId, updateData) {
        try {
            const response = await apiPatch(`${ORDERS_API_BASE}/${orderId}/`, updateData);
            return response;
        } catch (error) {
            console.error('[OrderService] Failed to update order:', error);
            throw error;
        }
    }

    async deleteOrder(orderId) {
        try {
            await apiDelete(`${ORDERS_API_BASE}/${orderId}/`);
            return true;
        } catch (error) {
            console.error('[OrderService] Failed to delete order:', error);
            throw error;
        }
    }

    async fetchOrderStatistics() {
        try {
            // Use today_stats for real-time today's data
            const todayStats = await apiGet(`${ORDERS_API_BASE}/today_stats/`);

            // Get all-time total orders count
            const allStats = await apiGet(`${ORDERS_API_BASE}/?page_size=1`);
            const totalOrdersAllTime = allStats.count || 0;

            // Calculate new this week (last 7 days) - use Manila timezone
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekAgoManila = weekAgo.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
            const weekStats = await apiGet(`${ORDERS_API_BASE}/?date_from=${weekAgoManila}&page_size=1`);
            const newThisWeek = weekStats.count || 0;

            return {
                totalOrders: totalOrdersAllTime,
                completed: todayStats.completed_orders_today || 0,
                processing: todayStats.processing_orders_today || 0,
                pending: todayStats.pending_orders_today || 0,
                newThisWeek: newThisWeek
            };
        } catch (error) {
            console.error('[OrderService] Failed to fetch statistics:', error);
            return {
                totalOrders: 0,
                completed: 0,
                processing: 0,
                pending: 0,
                newThisWeek: 0
            };
        }
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
}