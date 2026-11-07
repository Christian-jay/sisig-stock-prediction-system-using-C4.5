import DashboardService from '../services/DashboardService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { formatQuantity } from '../utils/format.js';
import { protectPage } from '../utils/AuthGuard.js';

/**
 * DashboardController
 * Handles communication between DashboardService and UI rendering.
 */
class DashboardController {
    constructor() {
        this.dashboardService = new DashboardService();
    }

    async init() {
        // Protect page and get user data
        const userData = await protectPage({ allowedRoles: ['ADMIN'] });
        if (!userData) return; // Redirected to login

        try {
            // Load sidebar and topbar FIRST before fetching data
            loadSidebarNav('', userData);
            loadTopNavbar(userData);

            const data = await this.dashboardService.fetchDashboardData();
            this.renderMetrics(data.metrics);
            this.renderQuickStats(data.metrics);
            this.renderSalesChart(data.salesOverview);
            this.renderTopSelling(data.topSellingItems.slice(0, 5), 'topSellingList');
            this.renderTopSelling(data.topSellingItems.slice(0, 5), 'revenueItemsList');
            this.renderRecentOrders(data.recentOrders);
            this.renderLowStock(data.lowStockItems.slice(0, 4));

            this.setupEventListeners();
        } catch (error) {
            console.error("Failed to load dashboard data", error);
            // Show error state in UI if needed
            this.showErrorState();
        }
    }

    setupEventListeners() {
        // New Order button on dashboard
        const newOrderBtn = document.getElementById('dashboardNewOrderBtn');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => {
                window.location.href = 'orders.html';
            });
        }

        // View buttons on recent orders table (delegated)
        const recentOrdersBody = document.getElementById('recentOrdersTableBody');
        if (recentOrdersBody) {
            recentOrdersBody.addEventListener('click', (e) => {
                const viewBtn = e.target.closest('.btn-sm-view');
                if (viewBtn) {
                    const orderId = viewBtn.getAttribute('data-id');
                    this.openViewOrderModal(orderId);
                }
            });
        }
    }

    // ===== MODAL HELPERS =====
    createModal(title, content) {
        const modalHtml = `
            <div class="modal-overlay" id="orderModal">
                <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
                    <div class="modal-header">
                        <h3 id="modalTitle">${title}</h3>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existing = document.getElementById('orderModal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('orderModal');

        // Close handlers
        modal.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el || e.target.classList.contains('modal-close') || e.target.classList.contains('modal-overlay')) {
                    this.closeModal();
                }
            });
        });

        // ESC to close
        const escHandler = (e) => { if (e.key === 'Escape') { this.closeModal(); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);

        // Trigger reflow for animation
        requestAnimationFrame(() => modal.classList.add('active'));

        return modal;
    }

    closeModal() {
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 200);
        }
    }

    // ===== VIEW ORDER MODAL =====
    async openViewOrderModal(orderId) {
        try {
            // Use DashboardService to fetch order details
            const order = await this.dashboardService.fetchOrderById(orderId);
            if (!order) {
                alert('Order not found');
                return;
            }

            const itemsHtml = order.items.map(item => `
                <tr>
                    <td>${item.menu_item_name || item.menu_item?.name || 'Unknown'}</td>
                    <td style="text-align: center;">${formatQuantity(item.quantity)}</td>
                    <td style="text-align: right;">₱${parseFloat(item.unit_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right;">₱${parseFloat(item.line_total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join('');

            const content = `
                <div class="order-detail">
                    <div class="order-detail-header">
                        <div class="detail-row">
                            <span class="detail-label">Order ID</span>
                            <span class="detail-value">${order.order_number || order.orderId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Type</span>
                            <span class="detail-value">${order.order_type || 'DINE_IN'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Payment</span>
                            <span class="detail-value">${order.payment_method || 'CASH'} (${order.payment_status || 'UNPAID'})</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status</span>
                            <span class="detail-value"><span class="badge ${(order.status || '').toLowerCase()}">${order.status || 'PENDING'}</span></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Date</span>
                            <span class="detail-value">${order.created_at ? new Date(order.created_at).toLocaleString('en-US', { timeZone: 'Asia/Manila' }) : order.date || 'N/A'}</span>
                        </div>
                    </div>

                    <h4 style="margin: 20px 0 10px;">Items</h4>
                    <div class="table-responsive">
                        <table class="data-table" style="font-size: 13px;">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th style="text-align: center;">Qty</th>
                                    <th style="text-align: right;">Price</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>

                    <div class="order-detail-footer" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Subtotal: ₱${parseFloat(order.subtotal || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                            ${order.discount_amount > 0 ? `<br><small>Discount: -₱${parseFloat(order.discount_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</small>` : ''}
                        </div>
                        <div style="text-align: right;">
                            <strong style="font-size: 1.2em;">Total: ₱${parseFloat(order.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                        </div>
                    </div>
                </div>
            `;

            this.createModal('Order Details', content);
        } catch (error) {
            console.error('Failed to load order details:', error);
            alert('Failed to load order details');
        }
    }

    showErrorState() {
        // Display user-friendly error for failed data loads
        const metricsElements = ['totalSales', 'totalOrders', 'lowStockCount', 'totalCustomers'];
        metricsElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '—';
        });
    }

    renderMetrics(metrics) {
        document.getElementById('totalSales').textContent = metrics.totalSales;
        document.getElementById('totalOrders').textContent = metrics.totalOrders;
        document.getElementById('lowStockCount').textContent = metrics.lowStockCount;
        document.getElementById('totalCustomers').textContent = metrics.totalCustomers;
    }

    renderQuickStats(metrics) {
        // Quick Stats box at bottom of dashboard
        // Total Menu Items
        const menuItemsEl = document.querySelector('.quick-stats-box .stat-mini:nth-child(1) .mini-val');
        const menuItemsSubEl = document.querySelector('.quick-stats-box .stat-mini:nth-child(1) .mini-sub');
        if (menuItemsEl) {
            menuItemsEl.textContent = metrics.totalMenuItems || 0;
            if (menuItemsSubEl) menuItemsSubEl.textContent = 'Active Items';
        }

        // Total Orders (Today)
        const todayOrdersEl = document.querySelector('.quick-stats-box .stat-mini:nth-child(2) .mini-val');
        const todayOrdersSubEl = document.querySelector('.quick-stats-box .stat-mini:nth-child(2) .mini-sub');
        if (todayOrdersEl) {
            todayOrdersEl.textContent = metrics.todayOrders || 0;
            if (todayOrdersSubEl) todayOrdersSubEl.textContent = `${metrics.completedOrdersToday || 0} completed, ${metrics.pendingOrdersToday || 0} pending`;
        }

        // Total Customers
        const customersEl = document.querySelector('.quick-stats-box .stat-mini:nth-child(3) .mini-val');
        const customersSubEl = document.querySelector('.quick-stats-box .stat-mini:nth-child(3) .mini-sub');
        if (customersEl) {
            customersEl.textContent = metrics.totalCustomers || 0;
            if (customersSubEl) customersSubEl.textContent = 'Registered';
        }

        // Average Order Value
        const aovEl = document.querySelector('.quick-stats-box .stat-mini:nth-child(4) .mini-val');
        const aovSubEl = document.querySelector('.quick-stats-box .stat-mini:nth-child(4) .mini-sub');
        if (aovEl && metrics.todayOrders > 0) {
            const aov = metrics.todayRevenue / metrics.todayOrders;
            aovEl.textContent = '₱' + aov.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            if (aovSubEl) aovSubEl.textContent = 'Today\'s average';
        }
    }

    renderSalesChart(overview) {
        /* =====================================================
           SALES OVERVIEW BAR CHART
           ===================================================== */

        const container = document.getElementById('salesBarChart');

        // Calculate max value from data or use default
        const amounts = overview.map(item => item.amount);
        const maxValue = Math.max(...amounts, 25000);
        const gridValues = this.generateGridValues(maxValue);

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
                        const amount = item.amount || 0;
                        const height = Math.min((amount / maxValue) * 100, 100);

                        return `
                            <div class="bar-group">
                                <div class="bar-wrapper">
                                    <div class="bar-value">
                                        ₱${amount.toLocaleString()}
                                    </div>
                                    <div class="bar" style="height: ${height}%" title="₱${amount.toLocaleString()}"></div>
                                </div>
                                <span class="bar-label">${item.date}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

        /* =====================================================
           SALES TREND LINE CHART (Bounded - from Sales Report)
           ===================================================== */

        const trendContainer = document.getElementById('salesTrendChart');
        if (!trendContainer) return;

        /*
         * Convert overview data into numeric values
         */
        const labels = overview.map(item => item.date);
        const values = overview.map(item => Number(item.amount) || 0);

        if (labels.length === 0 || values.length === 0) {
            trendContainer.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:40px;">No sales data available</div>';
            return;
        }

        // Store for resize handler
        this.dashboardTrendData = overview;
        this.dashboardTrendLabels = labels;
        this.dashboardTrendValues = values;

        const average = values.reduce((sum, value) => sum + value, 0) / values.length;
        const dataMax = Math.max(...values, 1);
        const tickStep = this.roundNice(dataMax / 5);
        const trendMaxValue = Math.max(tickStep * 5, 1);

        // Use the rendered plot dimensions so the SVG keeps a natural aspect ratio.
        const isNarrow = window.matchMedia('(max-width: 600px)').matches;
        const axisWidth = isNarrow ? 46 : 58;
        const columnGap = isNarrow ? 6 : 10;
        const plotWidth = Math.max(
            (trendContainer.clientWidth || (isNarrow ? 360 : 700)) - axisWidth - columnGap,
            120
        );
        const chartHeight = trendContainer.clientHeight || (isNarrow ? 250 : 240);
        const minPlotHeight = isNarrow ? 170 : 190;
        const plotHeight = Math.max(minPlotHeight, chartHeight - 24);
        // Keep the endpoint markers inside the clipped chart surface.
        const plotInset = isNarrow ? 8 : 10;
        const plotStart = plotInset;
        const plotEnd = plotWidth - plotInset;
        const plotTop = 16;
        const plotBottom = plotHeight - 6;
        const plotRange = plotBottom - plotTop;
        const pointRadius = isNarrow ? 3 : 3.5;

        const points = values.map((value, index) => {
            const x = labels.length === 1
                ? plotWidth / 2
                : plotStart + (index / (labels.length - 1)) * (plotEnd - plotStart);
            const y = plotBottom - (value / trendMaxValue) * plotRange;
            return {
                x,
                y,
                xPercent: (x / plotWidth) * 100,
                yPercent: (y / plotHeight) * 100,
                value,
                label: labels[index]
            };
        });

        const linePath = this.getSmoothPath(points, plotWidth, plotHeight);
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        const areaPath = `M ${firstPoint.x} ${plotBottom} L ${linePath.slice(1)} L ${lastPoint.x} ${plotBottom} Z`;
        const averageY = plotBottom - (average / trendMaxValue) * plotRange;

        const horizontalGridLines = [5, 4, 3, 2, 1, 0].map(index => {
            const y = plotTop + (index / 5) * plotRange;
            return `<line x1="${plotStart}" y1="${y}" x2="${plotEnd}" y2="${y}"/>`;
        }).join('');

        const verticalGridLines = points.map((point, index) => `
            <line x1="${point.x}" y1="${plotTop}" x2="${point.x}" y2="${plotBottom}"
                  class="report-trend-vertical-line"
                  opacity="${index === 0 || index === points.length - 1 ? 0 : 1}"/>
        `).join('');

        const yLabels = [5, 4, 3, 2, 1, 0].map(index => {
            const value = trendMaxValue * (1 - index / 5);
            const y = plotTop + (index / 5) * plotRange;
            const top = (y / plotHeight) * 100;
            return `<span style="top: ${top}%">₱${value.toLocaleString('en-PH', { maximumFractionDigits: 0 })}</span>`;
        }).join('');

        const xLabels = labels.map((label, index) => {
            const point = points[index];
            const transform = index === 0
                ? 'translateX(0)'
                : index === labels.length - 1
                    ? 'translateX(-100%)'
                    : 'translateX(-50%)';
            return `<span style="left: ${point.xPercent}%; transform: ${transform};">${label}</span>`;
        }).join('');

        trendContainer.innerHTML = `
            <div class="report-trend-chart"
                 style="--report-trend-plot-height: ${plotHeight}px; --report-trend-height: ${plotHeight + 24}px;">
                <div class="report-trend-y-axis">${yLabels}</div>

                <div class="report-trend-plot">
                    <svg class="report-trend-grid" viewBox="0 0 ${plotWidth} ${plotHeight}" preserveAspectRatio="none" aria-hidden="true">
                        <g class="report-trend-horizontal-lines">${horizontalGridLines}</g>
                        <g>${verticalGridLines}</g>
                    </svg>

                    <div class="report-trend-average" style="top: ${averageY}px;"
                         title="Average: ₱${average.toLocaleString('en-PH', { minimumFractionDigits: 2 })}"></div>

                    <svg class="report-trend-svg" viewBox="0 0 ${plotWidth} ${plotHeight}" preserveAspectRatio="none"
                         role="img" aria-label="Sales trend chart">
                        <defs>
                            <linearGradient id="reportSalesAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="var(--report-chart-area)" stop-opacity="0.24"/>
                                <stop offset="55%" stop-color="var(--report-chart-area)" stop-opacity="0.1"/>
                                <stop offset="100%" stop-color="var(--report-chart-area)" stop-opacity="0"/>
                            </linearGradient>
                            <linearGradient id="reportSalesLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="var(--report-chart-line)"/>
                                <stop offset="50%" stop-color="var(--report-chart-line-soft)"/>
                                <stop offset="100%" stop-color="var(--report-chart-line)"/>
                            </linearGradient>
                            <filter id="reportLineGlow" x="-10%" y="-20%" width="120%" height="140%">
                                <feGaussianBlur stdDeviation="1.1" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                            <filter id="reportPointGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2.2" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <path class="report-trend-area" d="${areaPath}"/>
                        <path class="report-trend-line" d="${linePath}"/>
                        <g class="report-trend-points">
                            ${points.map(point => `
                                <g class="report-trend-point-group">
                                    <circle class="report-trend-point-ring" cx="${point.x}" cy="${point.y}" r="${pointRadius * 2}"/>
                                    <circle class="report-trend-point-main" data-base-radius="${pointRadius}" cx="${point.x}" cy="${point.y}" r="${pointRadius}"/>
                                </g>
                            `).join('')}
                        </g>
                    </svg>
                </div>

                <div class="report-trend-x-axis">${xLabels}</div>
            </div>
        `;

        this.initBoundedTrendChartInteraction(trendContainer, points, labels, values);

        // Resize observer for responsiveness
        if (!this.dashboardTrendResizeObserver && typeof ResizeObserver !== 'undefined') {
            this.dashboardTrendResizeObserver = new ResizeObserver(entries => {
                const width = Math.round(entries[0]?.contentRect.width || 0);
                if (!width || width === this.dashboardTrendWidth) return;
                this.dashboardTrendWidth = width;
                this.renderSalesTrendChart(this.dashboardTrendData);
            });
            this.dashboardTrendResizeObserver.observe(trendContainer);
        }
        this.dashboardTrendWidth = Math.round(trendContainer.getBoundingClientRect().width);
    }

    // Smooth curve using Catmull-Rom spline converted to cubic bezier (with clamping)
    getSmoothPath(points, maxX = 100, maxY = 100) {
        if (points.length < 2) return `M ${points[0]?.x || 0} ${points[0]?.y || 0}`;
        if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i > 0 ? i - 1 : i];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

            // Catmull-Rom to cubic Bezier. Clamp control points to the
            // current SVG viewport so the curve cannot escape the chart.
            const clampX = value => Math.max(0, Math.min(maxX, value));
            const clampY = value => Math.max(0, Math.min(maxY, value));
            const cp1x = clampX(p1.x + (p2.x - p0.x) / 6);
            const cp1y = clampY(p1.y + (p2.y - p0.y) / 6);
            const cp2x = clampX(p2.x - (p3.x - p1.x) / 6);
            const cp2y = clampY(p2.y - (p3.y - p1.y) / 6);

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
        return path;
    }

    roundNice(num) {
        if (num === 0) return 0;
        const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(num))));
        const normalized = num / magnitude;
        let nice;
        if (normalized <= 1) nice = 1;
        else if (normalized <= 2) nice = 2;
        else if (normalized <= 2.5) nice = 2.5;
        else if (normalized <= 5) nice = 5;
        else nice = 10;
        return nice * magnitude;
    }

    initBoundedTrendChartInteraction(container, points, labels, values) {
        const chartArea = container.querySelector('.report-trend-plot');
        const svg = container.querySelector('.report-trend-svg');
        const pointGroups = container.querySelectorAll('.report-trend-point-group');
        if (!chartArea || !svg) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'report-trend-tooltip';
        tooltip.setAttribute('role', 'status');
        tooltip.setAttribute('aria-live', 'polite');
        chartArea.appendChild(tooltip);

        const getPointRadius = main => Number(main?.dataset.baseRadius) || 3;
        const getViewBoxWidth = () => svg.viewBox.baseVal.width || svg.getBoundingClientRect().width;
        const getViewBoxHeight = () => svg.viewBox.baseVal.height || svg.getBoundingClientRect().height;

        const hideTooltip = () => {
            tooltip.style.opacity = '0';
            pointGroups.forEach(group => {
                group.querySelector('.report-trend-point-ring')?.style.setProperty('opacity', '0');
                const main = group.querySelector('.report-trend-point-main');
                main?.setAttribute('r', getPointRadius(main));
            });
        };

        const showTooltip = (point, index) => {
            const plotRect = svg.getBoundingClientRect();
            const areaRect = chartArea.getBoundingClientRect();
            const pointX = (point.x / getViewBoxWidth()) * plotRect.width;
            const pointY = (point.y / getViewBoxHeight()) * plotRect.height;

            tooltip.innerHTML = `<strong>${labels[index]}</strong><br>₱${values[index].toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
            tooltip.style.left = `${Math.max(4, Math.min(areaRect.width - tooltip.offsetWidth - 4, pointX - tooltip.offsetWidth / 2))}px`;
            tooltip.style.top = `${Math.max(4, pointY - tooltip.offsetHeight - 12)}px`;
            tooltip.style.opacity = '1';

            pointGroups.forEach((group, groupIndex) => {
                const ring = group.querySelector('.report-trend-point-ring');
                const main = group.querySelector('.report-trend-point-main');
                const baseRadius = getPointRadius(main);
                if (groupIndex === index) {
                    ring?.style.setProperty('opacity', '1');
                    main?.setAttribute('r', baseRadius + 1.5);
                } else {
                    ring?.style.setProperty('opacity', '0');
                    main?.setAttribute('r', baseRadius);
                }
            });
        };

        chartArea.addEventListener('mousemove', event => {
            const plotRect = svg.getBoundingClientRect();
            if (!plotRect.width) return;

            const mouseX = ((event.clientX - plotRect.left) / plotRect.width) * getViewBoxWidth();
            const closestIndex = points.reduce((bestIndex, point, index) => {
                const bestDistance = Math.abs(points[bestIndex].x - mouseX);
                const distance = Math.abs(point.x - mouseX);
                return distance < bestDistance ? index : bestIndex;
            }, 0);

            showTooltip(points[closestIndex], closestIndex);
        });

        chartArea.addEventListener('mouseleave', hideTooltip);
    }

    generateGridValues(maxValue) {
        // Generate 6 grid lines from max down to 0
        const step = Math.ceil(maxValue / 5 / 1000) * 1000; // Round to nearest 1000
        const actualMax = step * 5;
        const values = [];
        for (let i = 5; i >= 0; i--) {
            values.push(step * i);
        }
        return values;
    }

    renderTopSelling(items, elementId) {
        const container = document.getElementById(elementId);
        if (!container) return;
        container.innerHTML = items.map(item => `
            <div class="top-item-row">
                <div class="item-info-group">
                    <span class="item-rank">${item.rank}</span>
                    <div class="item-thumb">
                         <img
                            src="${item.image_url || 'https://picsum.photos/id/237/200/300'}"
                            alt="${item.name}"
                            onerror="this.src='https://picsum.photos/id/237/200/300'"
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
        if (!tbody) return;

        // Limit to 5 most recent orders
        const recentOrders = orders.slice(0, 5);

        tbody.innerHTML = recentOrders.map(order => `
            <tr>
                <td><strong>${order.orderId}</strong></td>
                <td>${order.items}</td>
                <td>${order.price}</td>
                <td><span class="badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>${order.date}</td>
                <td><button class="btn-sm-view" data-id="${order.id}">View</button></td>
            </tr>
        `).join('');
    }

    renderLowStock(stocks) {
        const tbody = document.getElementById('lowStockTableBody');
        if (!tbody) return;
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
                <td>${formatQuantity(stock.quantity)}</td>
                <td>${stock.unit}</td>
                <td><span class="badge lowstock">${stock.status}</span></td>
            </tr>
        `).join('');
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    const controller = new DashboardController();
    await controller.init();
});