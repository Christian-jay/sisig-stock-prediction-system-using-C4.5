import { DashboardModel } from '../models/DashboardModel.js';

export class DashboardService {
    async getDashboardData() {
        // Mock data matching the design
        const mockData = {
            orders: [
                { id: "#1001", item: "Sisig Burger (x1)", total: "₱55.00", status: "Completed" },
                { id: "#1002", item: "Sisig Meal (x1)", total: "₱85.00", status: "Processing" },
                { id: "#1003", item: "Sisig Sizzler (x1)", total: "₱99.00", status: "Pending" },
                { id: "#1004", item: "Lechon Kawali (x1)", total: "₱150.00", status: "Completed" },
                { id: "#1005", item: "Sisig Duo (x1)", total: "₱120.00", status: "Processing" }
            ],
            popularItems: [
                { name: "Sisig Burger", count: "18 orders" },
                { name: "Sisig Sizzler", count: "16 orders" },
                { name: "Sisig Meal", count: "14 orders" },
                { name: "Sisig Solo", count: "12 orders" },
                { name: "Sisig Family", count: "8 orders" }
            ],
            lowStockIngredients: [
                { name: "Mayo", quantity: 2, unit: "kg", status: "Low Stock" },
                { name: "Sili green", quantity: 1, unit: "kg", status: "Low Stock" },
                { name: "Kalamansi", quantity: 1, unit: "kg", status: "Low Stock" }
            ]
        };

        return new DashboardModel(mockData);
    }
}