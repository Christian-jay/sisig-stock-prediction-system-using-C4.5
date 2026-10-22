import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { SalesReportService } from '../services/SalesReportService.js';

class SalesReportController {
    constructor() {
        this.salesReportService = new SalesReportService();
        this.initSalesReport();
    }

    async initSalesReport() {
        try {
            // Kunin ang mga kinakailangang data mula sa Service
            const salesTrendData = await this.salesReportService.getSalesTrendData();
            const topSellingData = await this.salesReportService.getTopSellingItems();
            const salesByMenuData = await this.salesReportService.getSalesByMenu();
            const dailySalesData = await this.salesReportService.getDailySalesBreakdown();

            // I-render ang mga UI components
            this.renderSalesTrendChart(salesTrendData);
            this.renderTopSellingItems(topSellingData);
            this.renderSalesByMenuTable(salesByMenuData);
            this.renderDailySalesTable(dailySalesData);
        } catch (error) {
            console.error("Failed to load sales report data", error);
        }
    }

    /* =========================================================
       1. SALES TREND CHART RENDERER
       ========================================================= */
    renderSalesTrendChart(salesData) {
        const container = document.getElementById("salesTrendChart");
        if (!container || !salesData) return;

        const maxValue = 25000;
        const gridValues = [25000, 20000, 15000, 10000, 5000, 0];

        const width = 1000;
        const height = 220;
        const paddingLeft = 8;
        const paddingRight = 8;
        const paddingTop = 10;
        const paddingBottom = 8;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        const points = salesData.map((item, index) => {
            const x = paddingLeft + (index / (salesData.length - 1)) * chartWidth;
            const y = paddingTop + chartHeight - (item.amount / maxValue) * chartHeight;
            return { x, y, amount: item.amount, date: item.date };
        });

        let linePath = "";
        points.forEach((point, index) => {
            if (index === 0) {
                linePath = `M ${point.x} ${point.y}`;
                return;
            }
            const previous = points[index - 1];
            const controlPointX = (previous.x + point.x) / 2;
            linePath += ` C ${controlPointX} ${previous.y}, ${controlPointX} ${point.y}, ${point.x} ${point.y}`;
        });

        const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

        container.innerHTML = `
            <div class="trend-chart">
                <!-- Y AXIS -->
                <div class="trend-y-axis">
                    ${gridValues.map(val => `<span>₱${val.toLocaleString()}</span>`).join('')}
                </div>

                <!-- GRAPH AREA -->
                <div class="trend-graph-area">
                    <div class="trend-graph">
                        <!-- Horizontal Grid Lines -->
                        <div class="trend-grid">
                            ${gridValues.map(() => `<div class="trend-grid-line"></div>`).join('')}
                        </div>

                        <!-- Vertical Grid Lines (Y-Axis / Column Grids) -->
                        <div class="trend-grid-vertical">
                            ${salesData.map(() => `<div class="trend-grid-vertical-line"></div>`).join('')}
                        </div>

                        <!-- SVG Layer -->
                        <svg class="trend-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="Sales trend chart">
                            <defs>
                                <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#0284c7" stop-opacity="0.25" />
                                    <stop offset="100%" stop-color="#0284c7" stop-opacity="0.00" />
                                </linearGradient>
                            </defs>
                            <path class="trend-area" d="${areaPath}" />
                            <path class="trend-line" d="${linePath}" />
                            ${points.map((point, index) => `
                                <circle class="trend-point" cx="${point.x}" cy="${point.y}" r="4.5" data-index="${index}" />
                            `).join('')}
                        </svg>
                    </div>
                </div>

                <!-- X AXIS LABELS -->
                <div class="trend-x-labels">
                    ${salesData.map(item => `<span>${item.date}</span>`).join('')}
                </div>
            </div>
            <div id="salesTooltip" class="trend-tooltip" style="display: none;"></div>
        `;

        // Tooltip interactivity
        const tooltip = document.getElementById("salesTooltip");
        const chartPoints = container.querySelectorAll(".trend-point");

        chartPoints.forEach(point => {
            point.addEventListener("mouseenter", (e) => {
                const index = Number(point.dataset.index);
                const item = salesData[index];

                tooltip.innerHTML = `
                    <div>${item.date}</div>
                    <div>₱${item.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
                `;
                tooltip.style.display = "block";

                const rect = container.getBoundingClientRect();
                const xPos = e.clientX - rect.left;
                const yPos = e.clientY - rect.top - 45;

                tooltip.style.left = `${xPos}px`;
                tooltip.style.top = `${yPos}px`;
            });

            point.addEventListener("mouseleave", () => {
                tooltip.style.display = "none";
            });
        });
    }

    /* =========================================================
       2. TOP SELLING ITEMS RENDERER
       ========================================================= */
    renderTopSellingItems(topItems, limit = 5) {
        const listContainer = document.getElementById("topSellingList");
        if (!listContainer || !topItems) return;

        const limitedItems = topItems.slice(0, limit);

        listContainer.innerHTML = limitedItems.map(item => `
            <div class="top-item-row">
                <div class="top-item-info">
                    <span class="top-item-rank">#${item.rank}</span>
                    <img src="${item.image}" alt="${item.name}" class="top-item-img" onerror="this.src='assets/auth_page_img.jpg'">
                    <div>
                        <div class="top-item-name">${item.name}</div>
                        <span class="top-item-quantity">${item.quantity} sold</span>
                    </div>
                </div>
                <div class="top-item-sales">${item.sales}</div>
            </div>
        `).join('');
    }

    /* =========================================================
       3. SALES BY MENU ITEM TABLE RENDERER
       ========================================================= */
    renderSalesByMenuTable(items, limit = 7) {
        const tableBody = document.getElementById("salesByMenuTableBody");
        if (!tableBody || !items) return;

        // Limitahan ang bilang ng items na ire-render (default: 5 items)
        const limitedItems = items.slice(0, limit);

        tableBody.innerHTML = limitedItems.map(item => `
        <tr>
            <td>${item.id}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.quantity}</td>
            <td>${item.totalSales}</td>
            <td>${item.percentage}</td>
        </tr>
    `).join('');
    }

    /* =========================================================
       4. DAILY SALES BREAKDOWN TABLE RENDERER
       ========================================================= */
    renderDailySalesTable(dailySales, limit = 7) {
        const tableBody = document.getElementById("dailySalesTableBody");
        if (!tableBody || !dailySales) return;

        const limitedItems = dailySales.slice(0, limit);

        tableBody.innerHTML = limitedItems.map(row => `
            <tr>
                <td>${row.date}</td>
                <td><strong>${row.totalSales}</strong></td>
                <td>${row.orders}</td>
                <td>${row.avgOrderValue}</td>
            </tr>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSidebarNav();
    loadTopNavbar();
    new SalesReportController();
});