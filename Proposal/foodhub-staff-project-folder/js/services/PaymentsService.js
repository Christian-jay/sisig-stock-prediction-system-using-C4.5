import { PaymentModel } from '../models/PaymentsModel.js';
import { apiGet } from '../utils/api.js';

export class PaymentService {
    constructor() {
        this.paymentsCache = null;
        this.cacheTimestamp = null;
        this.cacheDuration = 30000; // 30 seconds cache
    }

    /* =========================================================
       FETCH ALL ORDERS FROM BACKEND API
       ========================================================= */
    async fetchPaymentsFromAPI() {
        try {
            // Return cached payments if the cache is still valid
            if (
                this.paymentsCache !== null &&
                this.cacheTimestamp !== null &&
                Date.now() - this.cacheTimestamp < this.cacheDuration
            ) {
                return this.paymentsCache;
            }

            const allOrders = [];
            let nextPage = '/orders/orders/?ordering=-created_at';

            // Fetch every page from Django REST Framework
            while (nextPage) {
                const response = await apiGet(nextPage);

                // Handle non-paginated responses
                if (Array.isArray(response)) {
                    allOrders.push(...response);
                    break;
                }

                if (!Array.isArray(response.results)) {
                    throw new Error(
                        'Unexpected orders API response: missing results array.'
                    );
                }

                allOrders.push(...response.results);

                if (response.next) {
                    const nextUrl = new URL(
                        response.next,
                        window.location.origin
                    );

                    // apiGet() already adds the /api prefix
                    let nextPath = nextUrl.pathname;

                    if (nextPath.startsWith('/api/')) {
                        nextPath = nextPath.substring(4);
                    }

                    nextPage = nextPath + nextUrl.search;
                } else {
                    nextPage = null;
                }
            }

            // Transform all fetched orders into payment transactions
            const payments = allOrders.map(order =>
                this.transformOrderToPayment(order)
            );

            this.paymentsCache = payments;
            this.cacheTimestamp = Date.now();

            console.log(`Payments loaded: ${payments.length} transactions`);

            return payments;
        } catch (error) {
            console.error('Failed to fetch payments from API:', error);
            return this.paymentsCache ?? [];
        }
    }

    /* =========================================================
       TRANSFORM ORDER INTO PAYMENT TRANSACTION
       ========================================================= */
    transformOrderToPayment(order) {
        const createdAt = new Date(order.created_at);

        const date =
            createdAt.toLocaleDateString('en-US', {
                timeZone: 'Asia/Manila',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) +
            ' - ' +
            createdAt.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Manila',
                hour: '2-digit',
                minute: '2-digit'
            });

        const methodMap = {
            CASH: 'Cash',
            GCASH: 'GCash',
            MAYA: 'Maya',
            FOODPANDA: 'Panda',
            CARD: 'Card',
            ONLINE: 'Online'
        };

        return {
            id: order.order_number,
            dbId: order.id,
            date,
            createdAt: order.created_at,
            method: methodMap[order.payment_method] ||
                order.payment_method ||
                'Unknown',
            amount: parseFloat(order.total_amount) || 0,
            status: order.payment_status || 'Unknown'
        };
    }

    /* =========================================================
       GET ALL PAYMENTS
       ========================================================= */
    async getPayments() {
        return await this.fetchPaymentsFromAPI();
    }

    /* =========================================================
       GET DASHBOARD METRICS
       ========================================================= */
    async getPaymentMetrics() {
        const payments = await this.getPayments();

        const getSummaryByMethod = methodName => {
            const filtered = payments.filter(
                payment =>
                    payment.method.toLowerCase() ===
                    methodName.toLowerCase()
            );

            return {
                count: filtered.length,
                totalAmount: filtered.reduce(
                    (sum, payment) => sum + payment.amount,
                    0
                )
            };
        };

        return {
            cash: getSummaryByMethod('Cash'),
            gcash: getSummaryByMethod('GCash'),
            maya: getSummaryByMethod('Maya'),
            panda: getSummaryByMethod('Panda'),
            allPayments: payments
        };
    }

    /* =========================================================
       ADD NEW PAYMENT TRANSACTION
       ========================================================= */
    addPayment(paymentData) {
        const newPayment = new PaymentModel(paymentData);

        if (this.paymentsCache !== null) {
            this.paymentsCache.unshift(newPayment);
        }

        return newPayment;
    }
}