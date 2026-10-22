import DashboardService from '../services/DashboardService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

/**
 * DashboardController
 * Handles communication between DashboardService and UI rendering.
 */
class DashboardController {
    constructor() {
        this.dashboardService = new DashboardService();
        this.initDashboard();
    }

    async initDashboard() {
        try {
            const data = await this.dashboardService.fetchDashboardData();
            this.renderMetrics(data.metrics);
            this.renderSalesChart(data.salesOverview);
            this.renderTopSelling(data.topSellingItems, 'topSellingList');
            this.renderTopSelling(data.topSellingItems, 'revenueItemsList'); // Reused for revenue list side
            this.renderRecentOrders(data.recentOrders);
            this.renderLowStock(data.lowStockItems);

            this.renderLowStock(data.lowStockItems.slice(0, 4));
            this.renderTopSelling(data.topSellingItems.slice(0, 5), 'topSellingList');
            this.renderTopSelling(data.topSellingItems.slice(0, 5), 'revenueItemsList');
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        }
    }

    renderMetrics(metrics) {
        document.getElementById('totalSales').textContent = metrics.totalSales;
        document.getElementById('totalOrders').textContent = metrics.totalOrders;
        document.getElementById('lowStockCount').textContent = metrics.lowStockCount;
        document.getElementById('totalCustomers').textContent = metrics.totalCustomers;
    }

    renderSalesChart(overview) {

        /* =====================================================
           SALES OVERVIEW BAR CHART
           ===================================================== */

        const container = document.getElementById('salesBarChart');

        const maxValue = 25000;
        const gridValues = [25000, 20000, 15000, 10000, 5000, 0];

        container.innerHTML = `
        <div class="sales-chart">

            <!-- Y AXIS -->
            <div class="chart-y-axis">
                ${gridValues.map(value => `
                    <span>₱${value.toLocaleString()}</span>
                `).join('')}
            </div>

            <!-- CHART AREA -->
            <div class="chart-main">

                <!-- GRID -->
                <div class="chart-grid">
                    ${gridValues.map(() => `
                        <span></span>
                    `).join('')}
                </div>

                <!-- BARS -->
                <div class="bars-container">
                    ${overview.map(item => {

            const amount =
                parseFloat(
                    String(item.amount)
                        .replace(/[₱,]/g, '')
                ) || 0;

            const height =
                Math.min((amount / maxValue) * 100, 100);

            return `
                            <div class="bar-group">

                                <div class="bar-wrapper">

                                    <div
                                        class="bar-value"
                                    >
                                        ₱${amount.toLocaleString()}
                                    </div>

                                    <div
                                        class="bar"
                                        style="height: ${height}%"
                                        title="₱${amount.toLocaleString()}"
                                    ></div>

                                </div>

                                <span class="bar-label">
                                    ${item.date}
                                </span>

                            </div>
                        `;

        }).join('')}
                </div>

            </div>

        </div>
    `;


        /* =====================================================
           SALES TREND LINE CHART
           ===================================================== */

        const trendContainer =
            document.getElementById('salesTrendChart');

        const trendMax = 25000;

        /*
         * Convert overview data into numeric values
         */
        const trendData = overview.map(item => {

            const amount =
                parseFloat(
                    String(item.amount)
                        .replace(/[₱,]/g, '')
                ) || 0;

            return {
                date: item.date,
                amount: amount
            };

        });


        /*
         * SVG dimensions
         */
        const width = 500;
        const height = 210;

        const paddingX = 8;
        const paddingY = 8;

        const chartWidth = width - (paddingX * 2);
        const chartHeight = height - (paddingY * 2);


        /*
         * Calculate point positions
         */
        const points = trendData.map((item, index) => {

            const x =
                trendData.length === 1
                    ? width / 2
                    : paddingX +
                    (index / (trendData.length - 1)) *
                    chartWidth;

            const y =
                paddingY +
                chartHeight -
                (item.amount / trendMax) *
                chartHeight;

            return {
                x,
                y,
                amount: item.amount,
                date: item.date
            };

        });


        /*
         * Create smooth line
         */
        let linePath = '';

        points.forEach((point, index) => {

            if (index === 0) {
                linePath += `M ${point.x} ${point.y}`;
            } else {

                const previous = points[index - 1];

                const controlX =
                    (previous.x + point.x) / 2;

                linePath += `
                C ${controlX} ${previous.y},
                  ${controlX} ${point.y},
                  ${point.x} ${point.y}
            `;
            }

        });


        /*
         * Create filled area underneath line
         */
        const areaPath = `
        ${linePath}
        L ${points[points.length - 1].x} ${height}
        L ${points[0].x} ${height}
        Z
    `;


        trendContainer.innerHTML = `
        <div class="sales-chart trend-chart">

            <!-- Y AXIS -->
            <div class="chart-y-axis trend-y-axis">
                ${gridValues.map(value => `
                    <span>₱${value.toLocaleString()}</span>
                `).join('')}
            </div>

            <!-- CHART -->
            <div class="chart-main">

                <!-- GRID -->
                <div class="chart-grid">
                    ${gridValues.map(() => `
                        <span></span>
                    `).join('')}

                    <!-- VERTICAL GRID LINES -->
                    <div class="vertical-grid">
                        ${trendData.map(() => `
                            <span></span>
                        `).join('')}
                    </div>
                </div>

                <!-- SVG -->
                <svg
                    class="trend-svg"
                    viewBox="0 0 ${width} ${height}"
                    preserveAspectRatio="none"
                >

                    <!-- AREA -->
                    <path
                        d="${areaPath}"
                        class="trend-area"
                    />

                    <!-- LINE -->
                    <path
                        d="${linePath}"
                        class="trend-line"
                    />

                    <!-- POINTS -->
                    ${points.map(point => `
                        <circle
                            cx="${point.x}"
                            cy="${point.y}"
                            r="3.5"
                            class="trend-point"
                        />
                    `).join('')}

                </svg>

                <!-- X LABELS -->
                <div class="trend-x-labels">
                    ${trendData.map(item => `
                        <span>${item.date}</span>
                    `).join('')}
                </div>

            </div>

        </div>
    `;
    }

    renderTopSelling(items, elementId) {
        const container = document.getElementById(elementId);
        container.innerHTML = items.map(item => `
            <div class="top-item-row">
                <div class="item-info-group">
                    <span class="item-rank">${item.rank}</span>
                    <div class="item-thumb">
                         <img
                            src="https://picsum.photos/id/237/200/300"
                            alt="Top selling item"
                        >
                    </div>
                    <span class="item-name">${item.name}</span>
                </div>
                <span class="item-percentage">${item.percentage}</span>
            </div>
        `).join('');
    }

    renderRecentOrders(orders) {
        const tbody = document.getElementById('recentOrdersTableBody');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td><strong>${order.orderId}</strong></td>
                <td>${order.items}</td>
                <td>${order.price}</td>
                <td><span class="badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>${order.date}</td>
                <td><button class="btn-sm">View</button></td>
            </tr>
        `).join('');
    }

    renderLowStock(stocks) {
        const tbody = document.getElementById('lowStockTableBody');
        tbody.innerHTML = stocks.map(stock => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(202, 138, 4)"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z">
                            </path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        ${stock.ingredient}
                    </div>
                </td>
                <td>${stock.quantity}</td>
                <td>${stock.unit}</td>
                <td><span class="badge lowstock">${stock.status}</span></td>
            </tr>
        `).join('');
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
    loadSidebarNav();
    loadTopNavbar();
});