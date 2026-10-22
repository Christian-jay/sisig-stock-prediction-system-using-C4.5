import { OrderModel } from '../models/OrderModel.js';

export class OrderService {
    async fetchOrders() {
        // Dito mo ikokonekta ang Python Backend / MariaDB XAMPP API sa hinaharap (hal. fetch('/api/orders'))
        // Sa ngayon, nagbibigay tayo ng mock data para sa UI presentation:
        const mockData = [
            { id: 1, orderId: '#1001', totalOrders: 5, status: 'completed', date: 'Oct 20, 2025 4:32 PM' },
            { id: 2, orderId: '#1002', totalOrders: 3, status: 'processing', date: 'Oct 20, 2025 3:15 PM' },
            { id: 3, orderId: '#1003', totalOrders: 7, status: 'completed', date: 'Oct 20, 2025 2:10 PM' },
            { id: 4, orderId: '#1004', totalOrders: 2, status: 'pending', date: 'Oct 20, 2025 1:45 PM' },
            { id: 5, orderId: '#1005', totalOrders: 4, status: 'completed', date: 'Oct 20, 2025 12:20 PM' },
            { id: 6, orderId: '#1006', totalOrders: 1, status: 'processing', date: 'Oct 20, 2025 11:50 AM' },
            { id: 7, orderId: '#1007', totalOrders: 3, status: 'completed', date: 'Oct 20, 2025 11:10 AM' },
            { id: 8, orderId: '#1008', totalOrders: 2, status: 'pending', date: 'Oct 20, 2025 10:30 AM' },
            { id: 9, orderId: '#1009', totalOrders: 6, status: 'completed', date: 'Oct 20, 2025 9:45 AM' },
            { id: 10, orderId: '#1010', totalOrders: 3, status: 'completed', date: 'Oct 19, 2025 5:00 PM' },
            { id: 11, orderId: '#1011', totalOrders: 4, status: 'processing', date: 'Oct 19, 2025 4:15 PM' },
            { id: 12, orderId: '#1012', totalOrders: 2, status: 'completed', date: 'Oct 19, 2025 3:30 PM' },
            { id: 13, orderId: '#1013', totalOrders: 5, status: 'completed', date: 'Oct 19, 2025 2:00 PM' },
            { id: 14, orderId: '#1014', totalOrders: 1, status: 'pending', date: 'Oct 19, 2025 1:15 PM' },
            { id: 15, orderId: '#1015', totalOrders: 3, status: 'completed', date: 'Oct 19, 2025 11:45 AM' },
            { id: 16, orderId: '#1016', totalOrders: 4, status: 'processing', date: 'Oct 19, 2025 10:20 AM' },
            { id: 17, orderId: '#1017', totalOrders: 2, status: 'completed', date: 'Oct 18, 2025 6:00 PM' },
            { id: 18, orderId: '#1018', totalOrders: 6, status: 'completed', date: 'Oct 18, 2025 4:40 PM' },
            { id: 19, orderId: '#1019', totalOrders: 3, status: 'pending', date: 'Oct 18, 2025 3:10 PM' },
            { id: 20, orderId: '#1020', totalOrders: 1, status: 'completed', date: 'Oct 18, 2025 2:05 PM' },
            { id: 21, orderId: '#1021', totalOrders: 5, status: 'completed', date: 'Oct 18, 2025 1:00 PM' },
            { id: 22, orderId: '#1022', totalOrders: 2, status: 'processing', date: 'Oct 18, 2025 11:30 AM' },
            { id: 23, orderId: '#1023', totalOrders: 4, status: 'completed', date: 'Oct 18, 2025 10:15 AM' },
            { id: 24, orderId: '#1024', totalOrders: 3, status: 'completed', date: 'Oct 17, 2025 5:30 PM' },
            { id: 25, orderId: '#1025', totalOrders: 1, status: 'pending', date: 'Oct 17, 2025 4:10 PM' },
            { id: 26, orderId: '#1026', totalOrders: 2, status: 'completed', date: 'Oct 17, 2025 3:00 PM' },
            { id: 27, orderId: '#1027', totalOrders: 5, status: 'completed', date: 'Oct 17, 2025 1:50 PM' },
            { id: 28, orderId: '#1028', totalOrders: 3, status: 'processing', date: 'Oct 17, 2025 11:20 AM' },
            { id: 29, orderId: '#1029', totalOrders: 4, status: 'completed', date: 'Oct 17, 2025 10:00 AM' },
            { id: 30, orderId: '#1030', totalOrders: 2, status: 'completed', date: 'Oct 16, 2025 4:45 PM' },
            { id: 31, orderId: '#1031', totalOrders: 3, status: 'pending', date: 'Oct 16, 2025 3:20 PM' },
            { id: 32, orderId: '#1032', totalOrders: 6, status: 'completed', date: 'Oct 16, 2025 2:15 PM' },
            { id: 33, orderId: '#1033', totalOrders: 1, status: 'processing', date: 'Oct 16, 2025 11:00 AM' },
            { id: 34, orderId: '#1034', totalOrders: 4, status: 'completed', date: 'Oct 16, 2025 9:30 AM' }
        ];

        return mockData.map(item => new OrderModel(item));
    }

    async fetchOrderStatistics() {
        // Mock stats data para sa sidebar panel
        return {
            totalOrders: 34,
            completed: 24,
            processing: 7,
            pending: 3,
            newThisWeek: 6
        };
    }
}