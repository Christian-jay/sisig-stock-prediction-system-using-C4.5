import { OrderService } from '../services/OrderService.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';

class OrdersController {
    constructor() {
        this.itemsPerPage = 12;
        this.currentPage = 1;
        this.filteredOrders = [];
        this.currentFilter = 'all';
        this.searchQuery = '';

        this.ordersTableBody =
            document.getElementById('ordersTableBody');

        this.ordersPrevBtn =
            document.getElementById('ordersPrevBtn');

        this.ordersNextBtn =
            document.getElementById('ordersNextBtn');

        this.ordersPageInfo =
            document.getElementById('ordersPageInfo');

        this.orderService = new OrderService();

        this.initOrdersPagination();
        this.init();
    }

    async init() {
        await this.loadOrders();
        await this.loadStatistics();
        this.setupEventListeners();
    }

    async loadOrders() {
        const orders = await this.orderService.fetchOrders();

        this.allOrders = orders;
        this.applyFilters();
    }

    applyFilters() {
        const query = this.searchQuery.trim().toLowerCase();

        this.filteredOrders = (this.allOrders || []).filter(order => {
            const matchesStatus =
                this.currentFilter === 'all' ||
                order.status.toLowerCase() === this.currentFilter;

            const matchesSearch =
                String(order.orderId).toLowerCase().includes(query);

            return matchesStatus && matchesSearch;
        });

        // Return to the first page after filtering or searching.
        this.currentPage = 1;
        this.renderOrdersPage();
    }

    renderOrderRows(orders, startIndex) {
        if (!this.ordersTableBody) return;

        if (orders.length === 0) {
            this.ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 24px;">
                        No orders found.
                    </td>
                </tr>
            `;
            return;
        }

        this.ordersTableBody.innerHTML = orders.map((order, index) => `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td><strong>${order.orderId}</strong></td>
                <td>${order.totalOrders}</td>
                <td>
                    <span class="badge ${order.getStatusBadgeClass()}">
                        ${String(order.status).charAt(0).toUpperCase() +
            String(order.status).slice(1)}
                    </span>
                </td>
                <td style="color: #64748b; font-size: 13px;">
                    ${order.date}
                </td>
                <td>
                    <button
                        type="button"
                        class="btn-sm-view"
                        data-id="${order.orderId}"
                    >
                        View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderOrdersPage() {
        const totalItems = this.filteredOrders.length;

        const totalPages = Math.ceil(
            totalItems / this.itemsPerPage
        );

        // Calculate which 10 orders to display.
        const startIndex =
            (this.currentPage - 1) * this.itemsPerPage;

        const pageOrders = this.filteredOrders.slice(
            startIndex,
            startIndex + this.itemsPerPage
        );

        this.renderOrderRows(pageOrders, startIndex);

        if (this.ordersPageInfo) {
            this.ordersPageInfo.textContent = totalItems === 0
                ? 'No orders'
                : `Showing ${startIndex + 1}-${Math.min(
                    startIndex + pageOrders.length,
                    totalItems
                )} of ${totalItems} orders | Page ${this.currentPage} of ${totalPages}`;
        }

        if (this.ordersPrevBtn) {
            this.ordersPrevBtn.disabled = this.currentPage <= 1;
        }

        if (this.ordersNextBtn) {
            this.ordersNextBtn.disabled =
                totalPages === 0 || this.currentPage >= totalPages;
        }
    }

    initOrdersPagination() {
        this.ordersPrevBtn?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderOrdersPage();
            }
        });

        this.ordersNextBtn?.addEventListener('click', () => {
            const totalPages = Math.ceil(
                this.filteredOrders.length / this.itemsPerPage
            );

            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderOrdersPage();
            }
        });
    }

    async loadStatistics() {
        const stats =
            await this.orderService.fetchOrderStatistics();

        document.getElementById('statTotalOrders').textContent =
            stats.totalOrders;

        document.getElementById('statCompleted').textContent =
            stats.completed;

        document.getElementById('statProcessing').textContent =
            stats.processing;

        document.getElementById('statPending').textContent =
            stats.pending;

        document.getElementById('statNewThisWeek').textContent =
            stats.newThisWeek;
    }

    setupEventListeners() {
        // Status filter tabs
        const tabs = document.querySelectorAll(
            '#orderFilterTabs .tab-item'
        );

        tabs.forEach(tab => {
            tab.addEventListener('click', event => {
                event.preventDefault();

                tabs.forEach(item =>
                    item.classList.remove('active')
                );

                tab.classList.add('active');

                this.currentFilter =
                    tab.getAttribute('data-filter') || 'all';

                this.applyFilters();
            });
        });

        // Search orders by Order ID
        const searchInput =
            document.getElementById('orderSearchInput');

        if (searchInput) {
            searchInput.addEventListener('input', event => {
                this.searchQuery = event.target.value;
                this.applyFilters();
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OrdersController();
    loadSidebarNav();
    loadTopNavbar();
});
