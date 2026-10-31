import { DashboardService } from '../services/DashboardService.js';
import { DashboardModel } from '../models/DashboardModel.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

class DashboardController {
    constructor() {
        this.dashboardService = new DashboardService();

        // Low Stock Pagination State
        this.lowStockPage = 1;
        this.lowStockItemsPerPage = 3;
        this.allLowStockIngredients = []; // Store all ingredients for pagination

        this.init();
    }

    async init() {
        loadSidebarNav();
        loadTopNavbar();

        this.showLoadingStates();

        try {
            const rawData = await this.dashboardService.getDashboardData();
            console.log('[DashboardController] Raw data from service:', rawData);

            // Wrap raw data in DashboardModel for proper normalization
            this.model = new DashboardModel(rawData);
            console.log('[DashboardController] Normalized model:', this.model);

            this.renderAll();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showErrorStates('Failed to load dashboard data');
        }
    }

    showLoadingStates() {
        this.setMetricLoading('todaySalesValue', true);
        this.setMetricLoading('ordersTodayValue', true);
        this.setMetricLoading('pendingOrdersValue', true);
        this.setMetricLoading('lowStockCountValue', true);

        this.setTableLoading('todaysOrdersTableBody', true);
        this.setListLoading('popularItemsList', true);
        this.setTableLoading('lowStockTableBody', true);
    }

    setMetricLoading(elementId, loading) {
        const el = document.getElementById(elementId);
        if (el) {
            if (loading) {
                el.innerHTML = '<span class="skeleton-loader"></span>';
            }
        }
    }

    setTableLoading(tbodyId, loading) {
        const tbody = document.getElementById(tbodyId);
        if (tbody) {
            if (loading) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="loading-row">
                            <div class="loading-spinner"></div>
                            <span>Loading...</span>
                        </td>
                    </tr>
                `;
            }
        }
    }

    setListLoading(listId, loading) {
        const list = document.getElementById(listId);
        if (list) {
            if (loading) {
                list.innerHTML = `
                    <div class="loading-item">
                        <div class="skeleton-loader"></div>
                        <div class="skeleton-loader"></div>
                    </div>
                `;
            }
        }
    }

    showErrorStates(message) {
        this.setMetricError('todaySalesValue');
        this.setMetricError('ordersTodayValue');
        this.setMetricError('pendingOrdersValue');
        this.setMetricError('lowStockCountValue');

        this.setTableError('todaysOrdersTableBody', message);
        this.setListError('popularItemsList', message);
        this.setTableError('lowStockTableBody', message);
    }

    setMetricError(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = '—';
            el.style.color = 'var(--danger-text)';
        }
    }

    setTableError(tbodyId, message) {
        const tbody = document.getElementById(tbodyId);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="error-row">
                        <span class="error-text">${message}</span>
                    </td>
                </tr>
            `;
        }
    }

    setListError(listId, message) {
        const list = document.getElementById(listId);
        if (list) {
            list.innerHTML = `<div class="error-text">${message}</div>`;
        }
    }

    showEmptyStates() {
        this.setTableEmpty('todaysOrdersTableBody', 'No orders today');
        this.setListEmpty('popularItemsList', 'No popular items yet');
        this.setTableEmpty('lowStockTableBody', 'No low stock alerts');
    }

    setTableEmpty(tbodyId, message) {
        const tbody = document.getElementById(tbodyId);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-row">${message}</td>
                </tr>
            `;
        }
    }

    setListEmpty(listId, message) {
        const list = document.getElementById(listId);
        if (list) {
            list.innerHTML = `<div class="empty-text">${message}</div>`;
        }
    }

    renderAll() {
        if (!this.model) return;

        console.log('[DashboardController] renderAll - model:', this.model);
        console.log('[DashboardController] metrics:', {
            todaySales: this.model.todaySales,
            ordersToday: this.model.ordersToday,
            pendingOrders: this.model.pendingOrders,
            lowStockCount: this.model.lowStockCount
        });
        console.log('[DashboardController] orders:', this.model.orders);
        console.log('[DashboardController] popularItems:', this.model.popularItems);
        console.log('[DashboardController] lowStockIngredients:', this.model.lowStockIngredients);

        // Store all low stock ingredients for pagination
        this.allLowStockIngredients = this.model.lowStockIngredients || [];
        this.lowStockPage = 1; // Reset to first page on new data

        // Each render method handles its own errors so one failure doesn't break others
        try { this.renderMetrics(); } catch (e) { console.error('[DashboardController] renderMetrics failed:', e); }
        try { this.renderOrders(this.model.orders); } catch (e) { console.error('[DashboardController] renderOrders failed:', e); }
        try { this.renderPopularItems(this.model.popularItems); } catch (e) { console.error('[DashboardController] renderPopularItems failed:', e); }
        try { this.renderLowStock(); } catch (e) { console.error('[DashboardController] renderLowStock failed:', e); }
        try { this.initEventListeners(); } catch (e) { console.error('[DashboardController] initEventListeners failed:', e); }
    }

    renderMetrics() {
        console.log('[DashboardController] renderMetrics called');
        const todaySalesEl = document.getElementById('todaySalesValue');
        const ordersTodayEl = document.getElementById('ordersTodayValue');
        const pendingOrdersEl = document.getElementById('pendingOrdersValue');
        const lowStockCountEl = document.getElementById('lowStockCountValue');

        console.log('[DashboardController] Metric elements found:', {
            todaySalesEl: !!todaySalesEl,
            ordersTodayEl: !!ordersTodayEl,
            pendingOrdersEl: !!pendingOrdersEl,
            lowStockCountEl: !!lowStockCountEl
        });

        if (todaySalesEl) {
            todaySalesEl.textContent = this.model.todaySales || '₱0.00';
            console.log('[DashboardController] Set todaySales:', todaySalesEl.textContent);
        }
        if (ordersTodayEl) {
            ordersTodayEl.textContent = this.model.ordersToday || 0;
            console.log('[DashboardController] Set ordersToday:', ordersTodayEl.textContent);
        }
        if (pendingOrdersEl) {
            pendingOrdersEl.textContent = this.model.pendingOrders || 0;
            console.log('[DashboardController] Set pendingOrders:', pendingOrdersEl.textContent);
        }
        if (lowStockCountEl) {
            lowStockCountEl.textContent = this.model.lowStockCount || 0;
            console.log('[DashboardController] Set lowStockCount:', lowStockCountEl.textContent);
        }
    }

    renderOrders(orders) {
        console.log('[DashboardController] renderOrders called with:', orders);
        const tbody = document.getElementById('todaysOrdersTableBody');
        if (!tbody) {
            console.warn('[DashboardController] todaysOrdersTableBody not found!');
            return;
        }

        if (!orders || orders.length === 0) {
            console.log('[DashboardController] No orders to render');
            this.setTableEmpty('todaysOrdersTableBody', 'No orders today');
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${this.escapeHtml(order.id)}</strong></td>
                <td>${this.escapeHtml(order.item)}</td>
                <td>${this.escapeHtml(order.total)}</td>
                <td><span class="badge ${this.getStatusClass(order.status)}">${this.escapeHtml(order.status)}</span></td>
                <td><button class="btn-sm view-order-btn" data-order-id="${this.escapeHtml(order.id)}">View</button></td>
            </tr>
        `).join('');

        console.log('[DashboardController] Rendered', orders.length, 'orders');

        // Bind View buttons
        tbody.querySelectorAll('.view-order-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.dataset.orderId;
                this.viewOrder(orderId);
            });
        });
    }

    viewOrder(orderId) {
        // Navigate to orders.html with order ID, or open modal if implemented
        console.log('View order:', orderId);
        // For now, navigate to orders page
        window.location.href = `orders.html?order=${encodeURIComponent(orderId)}`;
    }

    renderPopularItems(items) {
        console.log('[DashboardController] renderPopularItems called with:', items);
        const listContainer = document.getElementById('popularItemsList');
        if (!listContainer) {
            console.warn('[DashboardController] popularItemsList not found!');
            return;
        }

        if (!items || items.length === 0) {
            console.log('[DashboardController] No popular items to render');
            this.setListEmpty('popularItemsList', 'No popular items yet');
            return;
        }

        listContainer.innerHTML = items.map(item => `
            <div class="popular-item-row">
                <div class="popular-item-left">
                    <div class="popular-item-image-placeholder"></div>
                    <span class="popular-name">${this.escapeHtml(item.name)}</span>
                </div>
                <span class="popular-count">${this.escapeHtml(item.count)}</span>
            </div>
        `).join('');

        console.log('[DashboardController] Rendered', items.length, 'popular items');
    }

    renderLowStock() {
        console.log('[DashboardController] renderLowStock called with:', this.allLowStockIngredients);
        const tbody = document.getElementById('lowStockTableBody');
        if (!tbody) {
            console.warn('[DashboardController] lowStockTableBody not found!');
            return;
        }

        const ingredients = this.allLowStockIngredients;
        const totalItems = ingredients.length;
        const totalPages = Math.ceil(totalItems / this.lowStockItemsPerPage) || 1;

        // Ensure current page is valid
        if (this.lowStockPage > totalPages) this.lowStockPage = totalPages;
        if (this.lowStockPage < 1) this.lowStockPage = 1;

        // Get items for current page
        const start = (this.lowStockPage - 1) * this.lowStockItemsPerPage;
        const end = start + this.lowStockItemsPerPage;
        const pageItems = ingredients.slice(start, end);

        if (pageItems.length === 0) {
            console.log('[DashboardController] No low stock items to render');
            this.setTableEmpty('lowStockTableBody', 'No low stock alerts');
        } else {
            tbody.innerHTML = pageItems.map(ing => `
                <tr>
                    <td><strong>${this.escapeHtml(ing.name)}</strong></td>
                    <td>${this.escapeHtml(ing.quantity)}</td>
                    <td>${this.escapeHtml(ing.unit)}</td>
                    <td><span class="badge ${this.getStatusClass(ing.status)}">${this.escapeHtml(ing.status)}</span></td>
                </tr>
            `).join('');

            console.log('[DashboardController] Rendered', pageItems.length, 'low stock items (page', this.lowStockPage, 'of', totalPages, ')');
        }

        // Update pagination info
        const infoEl = document.getElementById('lowStockPaginationInfo');
        if (infoEl) {
            const showingFrom = totalItems > 0 ? start + 1 : 0;
            const showingTo = Math.min(end, totalItems);
            infoEl.textContent = `Showing ${showingFrom}-${showingTo} of ${totalItems} items`;
        }

        // Update pagination buttons
        const prevBtn = document.getElementById('prevLowStockBtn');
        const nextBtn = document.getElementById('nextLowStockBtn');

        if (prevBtn) {
            prevBtn.disabled = this.lowStockPage <= 1;
            prevBtn.onclick = () => {
                if (this.lowStockPage > 1) {
                    this.lowStockPage--;
                    this.renderLowStock();
                }
            };
        }
        if (nextBtn) {
            nextBtn.disabled = this.lowStockPage >= totalPages;
            nextBtn.onclick = () => {
                if (this.lowStockPage < totalPages) {
                    this.lowStockPage++;
                    this.renderLowStock();
                }
            };
        }
    }

    getStatusClass(status) {
        const s = String(status).toLowerCase();
        if (s.includes('completed') || s === 'paid' || s === 'in stock') return 'badge-success';
        if (s.includes('processing') || s === 'low stock') return 'badge-warning';
        if (s.includes('pending') || s === 'unpaid' || s === 'out of stock') return 'badge-danger';
        return 'badge-secondary';
    }

    initEventListeners() {
        const newOrderBtn = document.getElementById('btnNewOrder');
        const expenseBtn = document.getElementById('btnRecordExpense');

        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => {
                window.location.href = 'orders.html';
            });
        }

        if (expenseBtn) {
            expenseBtn.addEventListener('click', () => {
                window.location.href = 'expenses.html';
            });
        }
    }

    escapeHtml(text) {
        if (!text && text !== 0) return '';
        return String(text)
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#039;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
});