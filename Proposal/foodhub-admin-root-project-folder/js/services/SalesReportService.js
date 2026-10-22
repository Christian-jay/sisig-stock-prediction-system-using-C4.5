import {
    SalesSummaryMetrics,
    SalesTrendItem,
    TopSellingItem,
    SalesByMenuItem,
    DailySalesBreakdownItem
} from '../models/SalesReportModel.js';

export class SalesReportService {
    async getSummaryMetrics() {
        return new SalesSummaryMetrics(
            { value: "₱24,835.00", trend: "↑ 12% vs. previous week" },
            { value: 28, trend: "↑ 8% vs. previous week" },
            { value: "₱172.68", trend: "↑ 6% vs. previous week" }
        );
    }

    async getSalesTrendData() {
        return [
            new SalesTrendItem("Oct 14", 8450),
            new SalesTrendItem("Oct 15", 10230),
            new SalesTrendItem("Oct 16", 12400),
            new SalesTrendItem("Oct 17", 14120),
            new SalesTrendItem("Oct 18", 16350),
            new SalesTrendItem("Oct 19", 17820),
            new SalesTrendItem("Oct 20", 20210)
        ];
    }

    async getTopSellingItems(limit = 5) {
        const allItems = [
            new TopSellingItem(1, "Special Sisig Rice", 142, "₱14,200.00", "assets/images/sisig.jpg"),
            new TopSellingItem(2, "Crispy Pata", 98, "₱19,600.00", "assets/images/crispy_pata.jpg"),
            new TopSellingItem(3, "Pork BBQ Meal", 85, "₱8,500.00", "assets/images/bbq.jpg"),
            new TopSellingItem(4, "Halo-Halo Special", 76, "₱6,840.00", "assets/images/halohalo.jpg"),
            new TopSellingItem(5, "Iced Tea (Pitcher)", 64, "₱3,200.00", "assets/images/icedtea.jpg")
        ];

        return allItems.slice(0, limit);
    }

    async getSalesByMenu(limit = 7) {
        const allItems = [
            new SalesByMenuItem(1, "Crispy Pata", 98, "₱19,600.00", "35.2%"),
            new SalesByMenuItem(2, "Special Sisig Rice", 142, "₱14,200.00", "25.5%"),
            new SalesByMenuItem(3, "Pork BBQ Meal", 85, "₱8,500.00", "15.3%"),
            new SalesByMenuItem(4, "Halo-Halo Special", 76, "₱6,840.00", "12.3%"),
            new SalesByMenuItem(5, "Iced Tea (Pitcher)", 64, "₱3,200.00", "5.7%"),
            new SalesByMenuItem(6, "Beef Sinigang", 52, "₱7,280.00", "4.5%"),
            new SalesByMenuItem(7, "Chicken Inasal", 48, "₱5,760.00", "3.8%"),
            new SalesByMenuItem(8, "Lechon Kawali", 41, "₱6,560.00", "3.2%")
        ];

        return allItems.slice(0, limit);
    }

    async getDailySalesBreakdown(limit = 7) {
        const allItems = [
            new DailySalesBreakdownItem("Oct 20, 2025", "₱20,210.00", 28, "₱721.78"),
            new DailySalesBreakdownItem("Oct 19, 2025", "₱17,820.00", 25, "₱712.80"),
            new DailySalesBreakdownItem("Oct 18, 2025", "₱16,350.00", 22, "₱743.18"),
            new DailySalesBreakdownItem("Oct 17, 2025", "₱14,120.00", 20, "₱706.00"),
            new DailySalesBreakdownItem("Oct 16, 2025", "₱12,400.00", 18, "₱688.89"),
            new DailySalesBreakdownItem("Oct 15, 2025", "₱10,230.00", 15, "₱682.00"),
            new DailySalesBreakdownItem("Oct 14, 2025", "₱8,450.00", 12, "₱704.17")
        ];

        return allItems.slice(0, limit);
    }
}