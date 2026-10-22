import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

/**
 * FOODHUB
 * Payment Controller
 */
class PaymentController {
    constructor() {
        this.orderData = this.getSavedOrderData();
    }

    /**
     * Retrieve active order data from local storage or fallback to defaults
     */
    getSavedOrderData() {
        try {
            const raw = localStorage.getItem('foodhub_current_order');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error('Failed to load order data from storage', e);
        }

        // Fallback default items matching the mockup UI
        return {
            orderId: '#1001',
            timestamp: 'Apr 27, 2025 • 10:24 AM',
            customerName: 'Juan Dela Cruz',
            items: [
                { name: 'Sisig Burger', quantity: 1, price: 55.00 },
                { name: 'Sisig Meal', quantity: 1, price: 85.00 },
                { name: 'Duo', quantity: 1, price: 120.00 }
            ]
        };
    }

    async init() {
        loadSidebarNav();
        loadTopNavbar();
        this.renderOrderSummary();
        this.bindEvents();
    }

    renderOrderSummary() {
        document.getElementById('orderIdText').textContent = this.orderData.orderId || '#1001';
        document.getElementById('orderTimestamp').textContent = this.orderData.timestamp || '';
        document.getElementById('customerName').textContent = this.orderData.customerName || 'Juan Dela Cruz';

        // Render Order Type (Dine-in / Takeout)
        const orderTypeBadge = document.getElementById('orderTypeBadge');
        if (orderTypeBadge) {
            orderTypeBadge.textContent = this.orderData.orderType || 'Takeout';
        }

        const tableBody = document.getElementById('paymentTableBody');
        if (!tableBody) return;

        let subtotal = 0;
        const rows = this.orderData.items.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return `
                <tr>
                    <td class="item-name">${item.name}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">₱${item.price.toFixed(2)}</td>
                    <td class="text-right">₱${itemTotal.toFixed(2)}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = rows.join('');

        document.getElementById('paymentSubtotal').textContent = `₱${subtotal.toFixed(2)}`;
        document.getElementById('paymentTax').textContent = `₱0.00`;
        document.getElementById('paymentTotal').textContent = `₱${subtotal.toFixed(2)}`;
    }

    bindEvents() {
        const payBtn = document.getElementById('btnConfirmPay');
        payBtn?.addEventListener('click', () => {
            alert('Payment successfully completed!');
            localStorage.removeItem('foodhub_current_order');
            window.location.href = 'orders.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const controller = new PaymentController();
    await controller.init();
});