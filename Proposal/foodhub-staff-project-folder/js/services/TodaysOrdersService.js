import { TodaysOrdersModel } from '../models/TodaysOrdersModel.js';

export class TodaysOrdersService {

    // Kunin ang lahat ng orders bilang static mock data
    getAllOrders() {
        const today = '2026-10-23';
        const yesterday = '2026-10-22';

        const mockRawData = [
            {
                id: '#1001',
                timestamp: `${today}T08:30:00Z`,
                items: [
                    { name: 'Sisig Special', qty: 2, price: 150 },
                    { name: 'Garlic Rice', qty: 2, price: 25 }
                ],
                subtotal: 350,
                tax: 42,
                discount: 0,
                total: 392,
                status: 'completed',
                paymentMethod: 'gcash',
                orderType: 'Dine-in'
            },
            {
                id: '#1002',
                timestamp: `${today}T09:15:00Z`,
                items: [
                    { name: 'Pork Sisig Value Meal', qty: 1, price: 180 },
                    { name: 'Coke Mismo', qty: 1, price: 30 }
                ],
                subtotal: 210,
                tax: 25.2,
                discount: 0,
                total: 235.2,
                status: 'processing',
                paymentMethod: 'cash',
                orderType: 'Takeout'
            },
            {
                id: '#1003',
                timestamp: `${today}T10:00:00Z`,
                items: [
                    { name: 'Bangus Sisig', qty: 3, price: 160 }
                ],
                subtotal: 480,
                tax: 57.6,
                discount: 96,
                total: 441.6,
                status: 'pending',
                paymentMethod: 'foodpanda',
                orderType: 'Delivery'
            },
            {
                id: '#1004',
                timestamp: `${today}T11:30:00Z`,
                items: [
                    { name: 'Tofu Sisig', qty: 2, price: 140 },
                    { name: 'Plain Rice', qty: 2, price: 20 }
                ],
                subtotal: 320,
                tax: 38.4,
                discount: 0,
                total: 358.4,
                status: 'completed',
                paymentMethod: 'gcash',
                orderType: 'Dine-in'
            },
            {
                id: '#1005',
                timestamp: `${today}T12:10:00Z`,
                items: [
                    { name: 'Sisig Barkada Meal', qty: 1, price: 550 },
                    { name: 'Iced Tea Pitcher', qty: 1, price: 120 }
                ],
                subtotal: 670,
                tax: 80.4,
                discount: 0,
                total: 750.4,
                status: 'processing',
                paymentMethod: 'maya',
                orderType: 'Dine-in'
            },
            {
                id: '#1006',
                timestamp: `${today}T13:45:00Z`,
                items: [
                    { name: 'Chicken Sisig', qty: 2, price: 170 }
                ],
                subtotal: 340,
                tax: 40.8,
                discount: 0,
                total: 380.8,
                status: 'pending',
                paymentMethod: 'grabfood',
                orderType: 'Delivery'
            },
            {
                id: '#0999',
                timestamp: `${yesterday}T16:20:00Z`,
                items: [
                    { name: 'Pork Sisig Value Meal', qty: 2, price: 180 }
                ],
                subtotal: 360,
                tax: 43.2,
                discount: 0,
                total: 403.2,
                status: 'completed',
                paymentMethod: 'cash',
                orderType: 'Takeout'
            },
            {
                id: '#1000',
                timestamp: `${yesterday}T14:20:00Z`,
                items: [
                    { name: 'Sisig Special', qty: 1, price: 150 }
                ],
                subtotal: 150,
                tax: 18,
                discount: 0,
                total: 168,
                status: 'completed',
                paymentMethod: 'maya',
                orderType: 'Dine-in'
            }
        ];

        return mockRawData.map(data => new TodaysOrdersModel(data));
    }

    getOrdersByDate(dateString) {
        const allOrders = this.getAllOrders();
        return allOrders.filter(order => order.getDateOnly() === dateString);
    }

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

    // Pansamantalang dummy save method lang kung may tumatawag man nito
    saveOrder(orderData) {
        console.warn("Static mode: Order not saved to localStorage. Modify static mock data array instead.");
        return new TodaysOrdersModel(orderData);
    }
}