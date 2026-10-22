import { DashboardService } from '../services/DashboardService.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';

class DashboardController {
    constructor() {
        this.dashboardService = new DashboardService();
        this.init();
    }

    async init() {
        // 1. I-load agad ang Sidebar at Top Navbar kasama ang custom title kung kinakailangan
        loadSidebarNav();
        loadTopNavbar();

        try {
            // 2. Fetch data at render sa UI
            const data = await this.dashboardService.getDashboardData();
            this.renderOrders(data.orders);
            this.renderPopularItems(data.popularItems);
            this.renderLowStock(data.lowStockIngredients);
            this.initEventListeners();
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    }

    renderOrders(orders) {
        const tbody = document.getElementById('todaysOrdersTableBody');
        if (!tbody) return;

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.item}</td>
                <td>${order.total}</td>
                <td><span class="badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td><button class="btn-sm" onclick="alert('Viewing order ${order.id}')">View</button></td>
            </tr>
        `).join('');
    }

    renderPopularItems(items) {
        const listContainer = document.getElementById('popularItemsList');

        if (!listContainer) return;

        listContainer.innerHTML = items.map(item => `
        <div class="popular-item-row">

            <div class="popular-item-left">

                <img
                    src="../foodhub-staff-project-folder/assets/auth_page_img.jpg"
                    alt="${item.name}"
                    class="popular-item-image"
                >

                <span class="popular-name">
                    ${item.name}
                </span>

            </div>

            <span class="popular-count">
                ${item.count}
            </span>

        </div>
    `).join('');
    }

    renderLowStock(ingredients) {
        const tbody = document.getElementById('lowStockTableBody');
        if (!tbody) return;

        tbody.innerHTML = ingredients.map(ing => `
            <tr>
                <td><strong>${ing.name}</strong></td>
                <td>${ing.quantity}</td>
                <td>${ing.unit}</td>
                <td><span class="badge low-stock">${ing.status}</span></td>
            </tr>
        `).join('');
    }

    initEventListeners() {
        document.getElementById('btnNewOrder')?.addEventListener('click', () => {
            alert('Redirecting to New Order creation modal/page...');
        });

        document.getElementById('btnRecordExpense')?.addEventListener('click', () => {
            alert('Opening Record Expense dialog...');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
});