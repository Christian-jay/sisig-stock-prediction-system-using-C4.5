import { TodaysOrdersService } from '../services/TodaysOrdersService.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';

export class TodaysOrdersController {
    constructor() {
        this.todaysOrdersService = new TodaysOrdersService();
        this.initLayout();
        this.loadOrders();
        this.initEventListeners();
    }

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();

        const dateInput = document.getElementById('orderDateFilter');
        if (dateInput) {
            dateInput.value = '2026-10-23'; // Itakda sa petsa ngayon
        }
    }

    loadOrders() {
        const tableBody = document.getElementById('ordersTableBody');
        const selectedDate = document.getElementById('orderDateFilter').value;

        const filteredOrders = this.todaysOrdersService.getOrdersByDate(selectedDate);
        const stats = this.todaysOrdersService.calculateStats(filteredOrders);
        this.updateStats(stats);

        if (filteredOrders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted" style="padding: 30px;">
                        No orders found for ${selectedDate}.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filteredOrders.map(order => {
            const orderId = order.id || '#1001';
            const timestamp = order.getFormattedTime ? order.getFormattedTime() : 'N/A';
            const total = order.total || 0;
            const status = order.status || 'pending';
            const itemsList = order.getItemsSummary ? order.getItemsSummary() : 'Standard Meal';

            // Piliin ang tamang badge class batay sa status
            let statusBadgeClass = 'badge-pending';
            const stLower = status.toLowerCase();
            if (stLower === 'completed') statusBadgeClass = 'badge-completed';
            else if (stLower === 'processing') statusBadgeClass = 'badge-processing';

            return `
                <tr>
                    <td><strong>${orderId}</strong></td>
                    <td><span class="text-muted">${timestamp}</span></td>
                    <td>${itemsList}</td>
                    <td><strong>₱${parseFloat(total).toFixed(2)}</strong></td>
                    <td><span class="badge-status ${statusBadgeClass}">${status}</span></td>
                    <td class="text-center">
                        <div class="action-btn-group">
                            <button class="btn-action btn-view" onclick="window.viewOrderDetails('${orderId}')">
                                View
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateStats(stats) {
        document.getElementById('statTotalOrders').textContent = stats.count;
        document.getElementById('statTotalRevenue').textContent = `₱${stats.totalRevenue.toFixed(2)}`;
    }

    initEventListeners() {
        const dateInput = document.getElementById('orderDateFilter');
        if (dateInput) {
            dateInput.addEventListener('change', () => this.loadOrders());
        }

        const btnReset = document.getElementById('btnResetDate');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                dateInput.value = '2026-10-23';
                this.loadOrders();
            });
        }

        window.viewOrderDetails = (orderId) => {
            alert(`Viewing details for Order ID: ${orderId}`);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodaysOrdersController();
});