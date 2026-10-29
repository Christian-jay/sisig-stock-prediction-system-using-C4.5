import { apiGet } from '../utils/api.js';

/**
 * FOODHUB
 * Today's Orders Service
 * Fetches orders from Django API with date filtering and pagination.
 */
export class TodaysOrdersService {

    /**
     * Get orders for a specific date with pagination.
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @param {number} page - Page number (1-based)
     * @param {number} pageSize - Items per page
     */
    async getOrdersByDate(dateString, page = 1, pageSize = 20) {
        try {
            const response = await apiGet(
                `/orders/orders/?date_from=${dateString}&date_to=${dateString}&ordering=-created_at&page=${page}&page_size=${pageSize}`
            );

            // Handle paginated response
            const orders = response.results || response;
            const pagination = {
                count: response.count || orders.length,
                totalPages: response.total_pages || Math.ceil((response.count || orders.length) / pageSize),
                currentPage: response.current_page || page,
                pageSize: pageSize
            };

            return {
                orders: orders.map(order => this.transformOrder(order)),
                pagination
            };
        } catch (error) {
            console.error('Failed to fetch orders from API:', error);
            return { orders: [], pagination: { count: 0, totalPages: 0, currentPage: 1, pageSize } };
        }
    }

    /**
     * Get all orders for stats calculation (no pagination).
     */
    async getAllOrders() {
        try {
            const response = await apiGet('/orders/orders/?ordering=-created_at&page_size=500');
            const orders = response.results || response;
            return orders.map(order => this.transformOrder(order));
        } catch (error) {
            console.error('Failed to fetch all orders:', error);
            return [];
        }
    }

    /**
     * Transform Django order to frontend format.
     */
    transformOrder(order) {
        const items = order.items || [];
        const itemsSummary = items.slice(0, 3).map(item =>
            `${item.menu_item_name} (x${item.quantity})`
        ).join(', ');

        // Format timestamp
        const createdAt = new Date(order.created_at);
        const formattedTime = createdAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const formattedDate = createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const timestamp = `${formattedDate} ${formattedTime}`;

        // Get date only for filtering (Manila timezone)
        const dateOnly = createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

        return {
            id: order.order_number,
            dbId: order.id,
            timestamp: timestamp,
            createdAt: order.created_at,
            dateOnly: dateOnly,
            items: items.map(item => ({
                name: item.menu_item_name,
                qty: item.quantity,
                price: parseFloat(item.unit_price)
            })),
            subtotal: parseFloat(order.subtotal),
            tax: parseFloat(order.tax_amount),
            discount: parseFloat(order.discount_amount),
            total: parseFloat(order.total_amount),
            status: order.status,
            statusDisplay: order.status_display,
            paymentMethod: order.payment_method,
            paymentMethodDisplay: order.payment_method_display,
            orderType: order.order_type,
            getFormattedTime: () => formattedTime,
            getDateOnly: () => dateOnly,
            getItemsSummary: () => itemsSummary || 'No items'
        };
    }

    /**
     * Calculate stats for orders.
     */
    calculateStats(orders) {
        const count = orders.length;
        const totalRevenue = orders.reduce((sum, order) => {
            const st = order.status ? order.status.toLowerCase() : '';
            if (st === 'completed' || st === 'processing') {
                return sum + (parseFloat(order.total) || 0);
            }
            return sum;
        }, 0);

        return { count, totalRevenue };
    }

    /**
     * Format currency in Philippine Peso format.
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount).replace('PHP', '₱');
    }
}