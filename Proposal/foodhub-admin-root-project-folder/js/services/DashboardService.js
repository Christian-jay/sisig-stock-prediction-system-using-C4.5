/**
 * DashboardService
 * Mocks database retrieval or API calls (future Django/Flask endpoints integration ready).
 */
export default class DashboardService {
    async fetchDashboardData() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    metrics: {
                        totalSales: "₱24,835.00",
                        totalOrders: 28,
                        lowStockCount: 4,
                        totalCustomers: 34
                    },
                    salesOverview: [
                        { date: "Oct 14", amount: 8000, height: "35%" },
                        { date: "Oct 15", amount: 11000, height: "48%" },
                        { date: "Oct 16", amount: 12500, height: "55%" },
                        { date: "Oct 17", amount: 14000, height: "62%" },
                        { date: "Oct 18", amount: 16000, height: "70%" },
                        { date: "Oct 19", amount: 17500, height: "78%" },
                        { date: "Oct 20", amount: 21000, height: "95%" }
                    ],
                    topSellingItems: [
                        { rank: "1.", name: "Sisig Burger", percentage: "18%" },
                        { rank: "2.", name: "Sisig Meal", percentage: "14%" },
                        { rank: "3.", name: "Sisig Sizzler", percentage: "10%" },
                        { rank: "4.", name: "Sisig (Solo)", percentage: "8%" },
                        { rank: "5.", name: "Sisig Family", percentage: "6%" }
                    ],
                    recentOrders: [
                        { id: 1, orderId: "#1001", items: "Sisig Burger (x1)", price: "₱55.00", status: "Completed", date: "Oct 20, 2025 4:12 PM" },
                        { id: 2, orderId: "#1002", items: "Maria Meal (x2)", price: "₱170.00", status: "Processing", date: "Oct 20, 2025 3:15 PM" },
                        { id: 3, orderId: "#1003", items: "Pedro Reyes (x1)", price: "₱99.00", status: "Completed", date: "Oct 20, 2025 2:10 PM" },
                        { id: 4, orderId: "#1004", items: "Ana Lim (x1)", price: "₱145.00", status: "Pending", date: "Oct 20, 2025 1:45 PM" },
                        { id: 5, orderId: "#1005", items: "Lechon Kawali (x1)", price: "₱150.00", status: "Completed", date: "Oct 20, 2025 12:20 PM" }
                    ],
                    lowStockItems: [
                        { ingredient: "Mayo", quantity: 2, unit: "kg", status: "Low Stock" },
                        { ingredient: "Sili green", quantity: 1, unit: "kg", status: "Low Stock" },
                        { ingredient: "Kalamansi", quantity: 1, unit: "kg", status: "Low Stock" },
                        { ingredient: "Onion", quantity: 2, unit: "kg", status: "Low Stock" }
                    ]
                });
            }, 300);
        });
    }
}