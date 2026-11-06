import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { apiGet } from '../utils/api.js';
import { API_BASE_URL } from '../utils/config.js';
import { protectPage } from '../utils/AuthGuard.js';

const ORDERS_API_BASE = '/orders/orders';
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

class SalesReportController {
    constructor() {
        this.dateRange = { start: null, end: null };
    }

    async init() {
        // Protect page and get user data
        const userData = await protectPage({ allowedRoles: ['ADMIN'] });
        if (!userData) return; // Redirected to login

        // Load sidebar and topbar with user data
        loadSidebarNav('', userData);
        loadTopNavbar(userData);

        this.setupDatePicker();
        this.setupEventListeners();
        await this.loadSalesReport();
    }

    setupDatePicker() {
        const datePickerBox = document.querySelector('.date-picker-box');
        if (!datePickerBox) return;

        // Create two date inputs for start and end date
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6); // 7 days including today

        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };

        const formatDisplayDate = (date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        this.dateRange = {
            start: weekAgo,
            end: today
        };

        // Replace the span with two date inputs
        datePickerBox.innerHTML = `
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <input type="date" id="dateStart" class="date-input"
                   value="${formatDate(weekAgo)}"
                   max="${formatDate(today)}"
                   min="${formatDate(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000))}">
            <span class="date-separator">-</span>
            <input type="date" id="dateEnd" class="date-input"
                   value="${formatDate(today)}"
                   max="${formatDate(today)}"
                   min="${formatDate(weekAgo)}">
        `;

        // Add styles for date inputs
        this.addDatePickerStyles();

        // Listen for date changes
        document.getElementById('dateStart').addEventListener('change', (e) => {
            this.handleDateChange('start', e.target.value);
        });
        document.getElementById('dateEnd').addEventListener('change', (e) => {
            this.handleDateChange('end', e.target.value);
        });
    }

    addDatePickerStyles() {
        if (document.getElementById('sales-report-date-styles')) return;

        const style = document.createElement('style');
        style.id = 'sales-report-date-styles';
        style.textContent = `
            .date-picker-box {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .date-input {
                border: none;
                background: transparent;
                color: var(--slate-text);
                font-family: inherit;
                font-size: 12px;
                font-weight: 500;
                padding: 4px 8px;
                outline: none;
                cursor: pointer;
            }
            .date-input:focus {
                background: var(--bg-secondary);
                border-radius: 4px;
            }
            .date-separator {
                color: var(--slate-muted);
                font-size: 12px;
                font-weight: 500;
            }
            .date-picker-box svg {
                flex-shrink: 0;
            }
        `;
        document.head.appendChild(style);
    }

    handleDateChange(type, value) {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Validate date range (max 7 days)
        const startDate = type === 'start' ? date : this.dateRange.start;
        const endDate = type === 'end' ? date : this.dateRange.end;

        // Ensure start <= end
        if (startDate > endDate) {
            if (type === 'start') {
                this.dateRange.end = new Date(startDate);
                document.getElementById('dateEnd').value = startDate.toISOString().split('T')[0];
            } else {
                this.dateRange.start = new Date(endDate);
                document.getElementById('dateStart').value = endDate.toISOString().split('T')[0];
            }
        }

        // Check 7-day limit
        const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 7) {
            if (type === 'start') {
                // Adjust end date to be max 7 days from start
                const maxEnd = new Date(startDate);
                maxEnd.setDate(startDate.getDate() + 6);
                this.dateRange.end = maxEnd;
                document.getElementById('dateEnd').value = maxEnd.toISOString().split('T')[0];
                document.getElementById('dateEnd').max = maxEnd.toISOString().split('T')[0];
            } else {
                // Adjust start date to be max 7 days before end
                const minStart = new Date(endDate);
                minStart.setDate(endDate.getDate() - 6);
                this.dateRange.start = minStart;
                document.getElementById('dateStart').value = minStart.toISOString().split('T')[0];
                document.getElementById('dateStart').min = minStart.toISOString().split('T')[0];
            }
            this.showToast('Date range limited to 7 days maximum', 'warning');
        }

        this.dateRange.start = new Date(document.getElementById('dateStart').value);
        this.dateRange.end = new Date(document.getElementById('dateEnd').value);

        // Reload data
        this.loadSalesReport();
    }

    setupEventListeners() {
        // Generate Report button
        const generateBtn = document.querySelector('.btn-primary');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.loadSalesReport());
        }

        // Product filter select
        const filterSelect = document.querySelector('.filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.loadSalesReport());
        }
    }

    async loadSalesReport() {
        try {
            this.showLoading(true);

            // Fetch data from backend endpoints
            const [salesOverview, topSelling, overallStats] = await Promise.all([
                this.fetchSalesOverview(),
                this.fetchTopSelling(7),  // Load seven items for the menu table
                this.fetchOverallStats()
            ]);

            this.updateMetrics(overallStats, salesOverview);
            this.updateSalesTrendChart(salesOverview);
            this.updateTopSellingList(topSelling.slice(0, 5));
            this.updateSalesByMenuTable(topSelling);
            this.updateDailySalesTable(salesOverview);

        } catch (error) {
            console.error('Failed to load sales report:', error);
            this.showToast('Failed to load sales report', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async fetchSalesOverview(days) {
        const startDate = this.dateRange.start.toISOString().split('T')[0];
        const endDate = this.dateRange.end.toISOString().split('T')[0];
        const response = await apiGet(`${ORDERS_API_BASE}/sales_overview/?start_date=${startDate}&end_date=${endDate}`);
        return response;
    }

    async fetchTopSelling(limit) {
        const response = await apiGet(`${ORDERS_API_BASE}/top_selling/?limit=${limit}`);
        return response;
    }

    async fetchOverallStats() {
        const response = await apiGet(`${ORDERS_API_BASE}/overall_stats/`);
        return response;
    }

    updateMetrics(overallStats, salesOverview) {
        // Total Sales
        const totalSalesEl = document.querySelector('.metric-card:first-child .metric-value');
        if (totalSalesEl) {
            totalSalesEl.textContent = `₱${salesOverview.values.reduce((a, b) => a + b, 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        }

        // Total Orders (for selected period)
        const totalOrdersEl = document.getElementById('totalOrders');
        if (totalOrdersEl) {
            const totalOrders = salesOverview.counts ? salesOverview.counts.reduce((a, b) => a + b, 0) : 0;
            totalOrdersEl.textContent = totalOrders.toLocaleString();
        }

        // Average Order Value (for selected period)
        const avgOrderEl = document.querySelector('.metric-card:nth-child(3) .metric-value');
        if (avgOrderEl) {
            const totalSales = salesOverview.values.reduce((a, b) => a + b, 0);
            const totalOrders = salesOverview.counts ? salesOverview.counts.reduce((a, b) => a + b, 0) : 0;
            const avgValue = totalOrders > 0 ? totalSales / totalOrders : 0;
            avgOrderEl.textContent = `₱${avgValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        }
    }

    updateSalesTrendChart(salesOverview) {
        this.renderBoundedSalesTrendChart(salesOverview);
    }

    renderBoundedSalesTrendChart(salesOverview) {
        const container = document.getElementById('salesTrendChart');
        if (!container) return;

        this.reportTrendData = salesOverview;
        const labels = Array.isArray(salesOverview.labels) ? salesOverview.labels : [];
        const values = Array.isArray(salesOverview.values)
            ? salesOverview.values.map(value => Number(value) || 0)
            : [];

        if (labels.length === 0 || values.length === 0) {
            container.innerHTML = '<div class="report-trend-empty">No sales data available</div>';
            return;
        }

        const average = values.reduce((sum, value) => sum + value, 0) / values.length;
        const backendMax = Number(salesOverview.max_value) || 0;
        const dataMax = Math.max(backendMax, ...values, 1);
        const tickStep = this.roundNice(dataMax / 5);
        const maxValue = Math.max(tickStep * 5, 1);

        // Use the rendered plot dimensions so the SVG keeps a natural aspect ratio.
        const isNarrow = window.matchMedia('(max-width: 600px)').matches;
        const axisWidth = isNarrow ? 46 : 58;
        const columnGap = isNarrow ? 6 : 10;
        const plotWidth = Math.max(
            (container.clientWidth || (isNarrow ? 360 : 700)) - axisWidth - columnGap,
            120
        );
        const chartHeight = container.clientHeight || (isNarrow ? 250 : 240);
        const minPlotHeight = isNarrow ? 170 : 190;
        const plotHeight = Math.max(minPlotHeight, chartHeight - 24);
        // Keep the endpoint markers inside the clipped chart surface.
        const plotInset = isNarrow ? 8 : 10;
        const plotStart = plotInset;
        const plotEnd = plotWidth - plotInset;
        const plotTop = 5;
        const plotBottom = plotHeight - 6;
        const plotRange = plotBottom - plotTop;
        const pointRadius = isNarrow ? 3 : 3.5;

        const points = values.map((value, index) => {
            const x = labels.length === 1
                ? plotWidth / 2
                : plotStart + (index / (labels.length - 1)) * (plotEnd - plotStart);
            const y = plotBottom - (value / maxValue) * plotRange;
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
        const averageY = plotBottom - (average / maxValue) * plotRange;

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
            const value = maxValue * (1 - index / 5);
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

        container.innerHTML = `
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

        this.initBoundedTrendChartInteraction(container, points, labels, values);

        if (!this.reportTrendResizeObserver && typeof ResizeObserver !== 'undefined') {
            this.reportTrendResizeObserver = new ResizeObserver(entries => {
                const width = Math.round(entries[0]?.contentRect.width || 0);
                if (!width || width === this.reportTrendWidth) return;
                this.reportTrendWidth = width;
                this.renderBoundedSalesTrendChart(this.reportTrendData);
            });
            this.reportTrendResizeObserver.observe(container);
        }
        this.reportTrendWidth = Math.round(container.getBoundingClientRect().width);
    }

    // Smooth curve using Catmull-Rom spline converted to cubic bezier
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

    initTrendChartInteraction(container, points, labels, values) {
        const svg = container.querySelector('.trend-svg');
        const tooltip = container.querySelector('.trend-tooltip');
        const pointGroups = container.querySelectorAll('.trend-point-group');
        const chartArea = container.querySelector('.trend-graph-area');

        if (!svg || !chartArea) return;

        // Create tooltip if not exists
        let tooltipEl = tooltip;
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'trend-tooltip';
            tooltipEl.style.cssText = `
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
            `;
            chartArea.appendChild(tooltipEl);
        }

        function showTooltip(point, index) {
            const amount = values[index];
            tooltipEl.innerHTML = `<strong>${labels[index]}</strong><br>₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            const rect = chartArea.getBoundingClientRect();
            const tooltipX = point.x - tooltipEl.offsetWidth / 2;
            const tooltipY = point.y - tooltipEl.offsetHeight - 12;

            tooltipEl.style.left = Math.max(4, Math.min(chartArea.clientWidth - tooltipEl.offsetWidth - 4, tooltipX)) + 'px';
            tooltipEl.style.top = Math.max(4, tooltipY) + 'px';
            tooltipEl.style.opacity = '1';
        }

        function hideTooltip() {
            tooltipEl.style.opacity = '0';
        }

        // Mouse move on chart area
        chartArea.addEventListener('mousemove', (e) => {
            const rect = chartArea.getBoundingClientRect();
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

        chartArea.addEventListener('mouseleave', () => {
            hideTooltip();
            pointGroups.forEach(g => {
                const ring = g.querySelector('.point-hover-ring');
                const mainPoint = g.querySelector('.trend-point-main');
                if (ring) ring.style.opacity = '0';
                if (mainPoint) mainPoint.setAttribute('r', '4.5');
            });
        });
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

    updateTopSellingList(topSelling) {
        const container = document.getElementById('topSellingList');
        if (!container) return;

        if (!topSelling || topSelling.length === 0) {
            container.innerHTML = '<p style="color: var(--slate-muted); text-align: center; padding: 20px;">No sales data available</p>';
            return;
        }

        container.innerHTML = topSelling.map((item, index) => {
            const rawImage = item.image_url || item.image || '';
            let imageUrl = '';

            if (/^https?:\/\//i.test(rawImage)) {
                imageUrl = rawImage;
            } else if (rawImage) {
                // Media files are served by Django on the API port, not Apache.
                const mediaPath = rawImage
                    .replace(/^\/+/, '')
                    .replace(/^media\//, '');
                const path = mediaPath.startsWith('menu_items/')
                    ? mediaPath
                    : `menu_items/${mediaPath}`;
                imageUrl = `${BACKEND_ORIGIN}/media/${path}`;
            }

            return `
                <div class="top-item-row">
                    <div class="top-item-info">
                        <span class="top-item-rank">${index + 1}.</span>
                        <img class="top-item-img" src="${imageUrl || ''}" alt="${item.name}"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="top-item-img-placeholder" style="display: none; width: 42px; height: 42px; border-radius: 6px; background: var(--border-color); align-items: center; justify-content: center; color: var(--slate-muted); font-size: 18px;">
                            🍽️
                        </div>
                        <div>
                            <div class="top-item-name">${item.name}</div>
                            <div class="top-item-quantity">${item.total_sold} sold</div>
                        </div>
                    </div>
                    <div class="top-item-sales">${item.revenue}</div>
                </div>
            `;
        }).join('');
    }

    updateSalesByMenuTable(topSelling) {
        const tbody = document.getElementById('salesByMenuTableBody');
        if (!tbody) return;

        if (!topSelling || topSelling.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--slate-muted); padding: 20px;">No sales data available</td></tr>';
            return;
        }

        const totalSold = topSelling.reduce((sum, item) => sum + (item.total_sold || 0), 0);

        tbody.innerHTML = topSelling.map((item, index) => {
            const percentage = totalSold > 0 ? ((item.total_sold / totalSold) * 100).toFixed(1) : 0;
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.total_sold}</td>
                    <td>${item.revenue}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        }).join('');
    }

    updateDailySalesTable(salesOverview) {
        const tbody = document.getElementById('dailySalesTableBody');
        if (!tbody) return;

        const { labels, values, counts } = salesOverview;

        if (!labels || labels.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--slate-muted); padding: 20px;">No sales data available</td></tr>';
            return;
        }

        tbody.innerHTML = labels.map((label, i) => {
            const total = values[i] || 0;
            const orderCount = counts[i] || 0;
            const avgOrderValue = orderCount > 0 ? total / orderCount : 0;
            return `
                <tr>
                    <td>${label}</td>
                    <td>₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td>${orderCount}</td>
                    <td>₱${avgOrderValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');
    }

    showLoading(show) {
        // Could add loading states to charts/tables
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        const dismissTimer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(dismissTimer);
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const controller = new SalesReportController();
    await controller.init();
});