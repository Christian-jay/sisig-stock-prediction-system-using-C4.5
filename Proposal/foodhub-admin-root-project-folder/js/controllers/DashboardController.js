import DashboardService from '../services/DashboardService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { formatQuantity } from '../utils/format.js';

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
            // Load sidebar and topbar FIRST before fetching data
            await loadSidebarNav();
            await loadTopNavbar();

            const data = await this.dashboardService.fetchDashboardData();
            this.renderMetrics(data.metrics);
            this.renderQuickStats(data.metrics);
            this.renderSalesChart(data.salesOverview);
            this.renderTopSelling(data.topSellingItems, 'topSellingList');
            this.renderTopSelling(data.topSellingItems, 'revenueItemsList'); // Reused for revenue list side
            this.renderRecentOrders(data.recentOrders);
            this.renderLowStock(data.lowStockItems);

            this.renderLowStock(data.lowStockItems.slice(0, 4));
            this.renderTopSelling(data.topSellingItems.slice(0, 5), 'topSellingList');
            this.renderTopSelling(data.topSellingItems.slice(0, 5), 'revenueItemsList');

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
           SALES TREND LINE CHART
           ===================================================== */

        const trendContainer = document.getElementById('salesTrendChart');
        const trendMax = maxValue;

        /*
         * Convert overview data into numeric values
         */
        const trendData = overview.map(item => ({
            date: item.date,
            amount: item.amount || 0
        }));

        /*
         * SVG dimensions - use container width for responsiveness
         */
        const containerRect = trendContainer.getBoundingClientRect();
        const width = containerRect.width || 500;
        const height = 210;
        const paddingX = 40;
        const paddingY = 20;
        const chartWidth = width - (paddingX * 2);
        const chartHeight = height - (paddingY * 2);

        /*
         * Calculate point positions
         */
        const points = trendData.map((item, index) => {
            const x = trendData.length === 1
                ? width / 2
                : paddingX + (index / (trendData.length - 1)) * chartWidth;
            const y = paddingY + chartHeight - (item.amount / trendMax) * chartHeight;
            return { x, y, amount: item.amount, date: item.date };
        });

        /*
         * Create smooth Catmull-Rom spline for natural curve
         */
        function getSmoothPath(points) {
            if (points.length < 2) return '';
            let path = `M ${points[0].x} ${points[0].y}`;

            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i > 0 ? i - 1 : i];
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

                // Catmull-Rom to cubic Bezier
                const cp1x = p1.x + (p2.x - p0.x) / 6;
                const cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;

                path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
            }
            return path;
        }

        const linePath = getSmoothPath(points);

        /*
         * Create filled area underneath line (straight to bottom)
         */
        const areaPath = `
        ${linePath}
        L ${points[points.length - 1].x} ${paddingY + chartHeight}
        L ${points[0].x} ${paddingY + chartHeight}
        Z
    `;

        /*
         * Generate vertical grid lines positions
         */
        const verticalGridLines = points.map((p, i) => `
            <line x1="${p.x}" y1="${paddingY}" x2="${p.x}" y2="${paddingY + chartHeight}"
                  stroke="var(--border-color, #e2e8f0)" stroke-width="1" stroke-dasharray="4,4"
                  opacity="${i === 0 || i === points.length - 1 ? 0 : 0.4}"/>
        `).join('');

        /*
         * Generate horizontal grid lines
         */
        const horizontalGridLines = [5, 4, 3, 2, 1, 0].map(i => {
            const y = paddingY + (i / 5) * chartHeight;
            const val = Math.round((i / 5) * trendMax);
            return `<line x1="${paddingX}" y1="${y}" x2="${paddingX + chartWidth}" y2="${y}"
                stroke="var(--border-color, #e2e8f0)" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>`;
        }).join('');

        trendContainer.innerHTML = `
        <div class="sales-chart trend-chart" style="position: relative;">
            <!-- Y AXIS LABELS -->
            <div class="chart-y-axis trend-y-axis" style="position: absolute; left: 0; top: ${paddingY}px; bottom: ${paddingY}px; width: ${paddingX}px; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none;">
                ${[5, 4, 3, 2, 1, 0].map(i => {
                    const val = Math.round((i / 5) * trendMax);
                    return `<span style="font-size: 11px; color: var(--text-muted, #64748b); text-align: right; padding-right: 8px;">₱${val.toLocaleString()}</span>`;
                }).join('')}
            </div>

            <!-- CHART AREA -->
            <div class="chart-main" style="margin-left: ${paddingX}px; margin-bottom: ${paddingY}px; position: relative; width: ${chartWidth}px; height: ${chartHeight}px;">
                <!-- GRID LINES -->
                <svg class="grid-svg" viewBox="0 0 ${width} ${height}" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible;">
                    ${horizontalGridLines}
                    ${verticalGridLines}
                </svg>

                <!-- MAIN CHART SVG -->
                <svg class="trend-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
                    <defs>
                        <!-- Gradient for area fill -->
                        <linearGradient id="trendAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.18"/>
                            <stop offset="100%" stop-color="#0284c7" stop-opacity="0.02"/>
                        </linearGradient>
                        <!-- Gradient for line -->
                        <linearGradient id="trendLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#0284c7"/>
                            <stop offset="50%" stop-color="#06b6d4"/>
                            <stop offset="100%" stop-color="#22d3ee"/>
                        </linearGradient>
                        <!-- Glow filter for line -->
                        <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="blur"/>
                            <feMerge>
                                <feMergeNode in="blur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    <!-- AREA FILL -->
                    <path d="${areaPath}" fill="url(#trendAreaGradient)" />

                    <!-- LINE -->
                    <path d="${linePath}"
                          stroke="url(#trendLineGradient)"
                          stroke-width="2.5"
                          fill="none"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          filter="url(#lineGlow)"
                          class="trend-line-path" />

                    <!-- INTERACTIVE POINTS -->
                    <g class="trend-points">
                        ${points.map((point, i) => `
                            <g class="trend-point-group" data-index="${i}" style="cursor: pointer;">
                                <!-- Outer glow ring -->
                                <circle cx="${point.x}" cy="${point.y}" r="8"
                                        fill="transparent"
                                        stroke="#0284c7"
                                        stroke-width="2"
                                        opacity="0"
                                        class="point-hover-ring"
                                        transition="opacity 0.2s"/>
                                <!-- Main point -->
                                <circle cx="${point.x}" cy="${point.y}" r="4.5"
                                        fill="var(--bg-primary, #fff)"
                                        stroke="#0284c7"
                                        stroke-width="2.5"
                                        class="trend-point-main" />
                                <!-- Inner dot -->
                                <circle cx="${point.x}" cy="${point.y}" r="2"
                                        fill="#0284c7"
                                        class="trend-point-inner" />
                            </g>
                        `).join('')}
                    </g>

                    <!-- VERTICAL HOVER INDICATOR LINE -->
                    <line id="hoverLine"
                          x1="0" y1="${paddingY}"
                          x2="0" y2="${paddingY + chartHeight}"
                          stroke="#0284c7"
                          stroke-width="1"
                          stroke-dasharray="4,4"
                          opacity="0"
                          pointer-events="none"/>
                </svg>

                <!-- TOOLTIP -->
                <div id="trendTooltip"
                     class="trend-tooltip"
                     style="
                        position: absolute;
                        background: var(--bg-card, #1e293b);
                        color: var(--text-primary, #f8fafc);
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        pointer-events: none;
                        opacity: 0;
                        transition: opacity 0.15s;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        border: 1px solid var(--border-color, #334155);
                        white-space: nowrap;
                        z-index: 10;
                     ">
                    <div class="tooltip-date" style="font-weight: 600; margin-bottom: 2px; color: #22d3ee;"></div>
                    <div class="tooltip-amount" style="color: #22c55e; font-weight: 500;"></div>
                </div>

                <!-- X AXIS LABELS -->
                <div class="trend-x-labels" style="display: flex; justify-content: space-between; margin-top: 8px; padding: 0 4px;">
                    ${trendData.map(item => `<span style="font-size: 11px; color: var(--text-muted, #64748b); white-space: nowrap;">${item.date}</span>`).join('')}
                </div>
            </div>
        </div>
    `;

        // Add hover interaction
        this.initTrendChartInteraction(trendContainer, points, trendData);
    }

    initTrendChartInteraction(container, points, trendData) {
        const svg = container.querySelector('.trend-svg');
        const hoverLine = container.querySelector('#hoverLine');
        const tooltip = container.querySelector('#trendTooltip');
        const pointGroups = container.querySelectorAll('.trend-point-group');

        if (!svg || !hoverLine || !tooltip) return;

        const chartMain = container.querySelector('.chart-main');
        const mainRect = chartMain?.getBoundingClientRect();

        function showTooltip(point, index) {
            const data = trendData[index];
            const amount = data.amount || 0;

            tooltip.querySelector('.tooltip-date').textContent = data.date;
            tooltip.querySelector('.tooltip-amount').textContent = '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            // Position tooltip above the point
            const tooltipX = point.x - (mainRect?.left || 0) - tooltip.offsetWidth / 2;
            const tooltipY = point.y - (mainRect?.top || 0) - tooltip.offsetHeight - 12;

            tooltip.style.left = Math.max(4, Math.min((mainRect?.width || 500) - tooltip.offsetWidth - 4, tooltipX)) + 'px';
            tooltip.style.top = Math.max(4, tooltipY) + 'px';
            tooltip.style.opacity = '1';
        }

        function hideTooltip() {
            tooltip.style.opacity = '0';
            hoverLine.style.opacity = '0';
        }

        // Mouse move on chart area
        if (chartMain) {
            chartMain.addEventListener('mousemove', (e) => {
                const rect = chartMain.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;

                // Find closest point
                let closestIndex = 0;
                let minDist = Infinity;
                points.forEach((p, i) => {
                    const dist = Math.abs(p.x - mouseX);
                    if (dist < minDist) {
                        minDist = dist;
                        closestIndex = i;
                    }
                });

                const closestPoint = points[closestIndex];

                // Show hover line
                hoverLine.setAttribute('x1', closestPoint.x);
                hoverLine.setAttribute('x2', closestPoint.x);
                hoverLine.style.opacity = '0.6';

                // Show tooltip
                showTooltip(closestPoint, closestIndex);

                // Highlight closest point
                pointGroups.forEach((g, i) => {
                    const ring = g.querySelector('.point-hover-ring');
                    const mainPoint = g.querySelector('.trend-point-main');
                    if (i === closestIndex) {
                        if (ring) ring.style.opacity = '1';
                        if (mainPoint) mainPoint.setAttribute('r', '6');
                    } else {
                        if (ring) ring.style.opacity = '0';
                        if (mainPoint) mainPoint.setAttribute('r', '4.5');
                    }
                });
            });

            chartMain.addEventListener('mouseleave', () => {
                hideTooltip();
                pointGroups.forEach(g => {
                    const ring = g.querySelector('.point-hover-ring');
                    const mainPoint = g.querySelector('.trend-point-main');
                    if (ring) ring.style.opacity = '0';
                    if (mainPoint) mainPoint.setAttribute('r', '4.5');
                });
            });
        }
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
        if (!tbody) return;
        tbody.innerHTML = orders.map(order => `
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
document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
});