import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

/**
 * FOODHUB
 * Payment Controller
 */
class PaymentController {
    constructor() {
        this.orderData = this.getSavedOrderData();
        this.subtotal = 0;
        this.taxAmount = 0;
        this.discountAmount = 0;
        this.grandTotal = 0;
    }

    getSavedOrderData() {
        try {
            const raw = localStorage.getItem('foodhub_current_order');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error('Failed to load order data from storage', e);
        }

        return {
            orderId: '#1001',
            timestamp: 'Apr 27, 2025 • 10:24 AM',
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

        const orderTypeBadge = document.getElementById('orderTypeBadge');
        if (orderTypeBadge) {
            orderTypeBadge.textContent = this.orderData.orderType || 'Takeout';
        }

        const tableBody = document.getElementById('paymentTableBody');
        if (!tableBody) return;

        this.subtotal = 0;
        const rows = this.orderData.items.map(item => {
            const itemTotal = item.price * item.quantity;
            this.subtotal += itemTotal;
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

        // --- PAYMENT METHOD BRAND STYLING SWITCH ---
        const paymentSelect = document.getElementById('paymentMethodSelect');
        if (paymentSelect) {
            paymentSelect.setAttribute('data-selected', paymentSelect.value);
            paymentSelect.addEventListener('change', (e) => {
                paymentSelect.setAttribute('data-selected', e.target.value);
            });
        }

        // --- STATUS DROPDOWN COLOR STYLING ---
        const statusSelect = document.getElementById('paymentStatusSelect');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === 'paid') {
                    statusSelect.classList.remove('status-unpaid');
                    statusSelect.classList.add('status-paid');
                } else {
                    statusSelect.classList.remove('status-paid');
                    statusSelect.classList.add('status-unpaid');
                }
            });
        }

        // Calculate Totals Initially
        this.calculateTotals();
    }

    calculateTotals() {
        const TAX_RATE = 0.12; // 12% Tax
        this.taxAmount = this.subtotal * TAX_RATE;

        // Check if PWD Discount toggle is active
        const pwdToggle = document.getElementById('pwdDiscountToggle');
        const discountRateInput = document.getElementById('discountRateInput');
        const isDiscountActive = pwdToggle ? pwdToggle.checked : false;

        let discountPercent = 0;
        if (isDiscountActive && discountRateInput) {
            discountPercent = parseFloat(discountRateInput.value) || 0;
        }

        // Calculate discount on subtotal
        this.discountAmount = (this.subtotal * discountPercent) / 100;
        this.grandTotal = (this.subtotal + this.taxAmount) - this.discountAmount;

        if (this.grandTotal < 0) this.grandTotal = 0;

        // Update Totals UI
        document.getElementById('paymentSubtotal').textContent = `₱${this.subtotal.toFixed(2)}`;

        const taxElement = document.getElementById('paymentTax');
        if (taxElement) {
            taxElement.textContent = `₱${this.taxAmount.toFixed(2)}`;
        }

        // Dynamic Discount Breakdown Row Rendering
        let discountRow = document.getElementById('paymentDiscountRow');
        const breakdownBox = document.querySelector('.payment-breakdown-box');

        if (isDiscountActive && this.discountAmount > 0) {
            if (!discountRow && breakdownBox) {
                discountRow = document.createElement('div');
                discountRow.id = 'paymentDiscountRow';
                discountRow.className = 'breakdown-row discount-row';

                // Insert right before total row
                const totalRow = breakdownBox.querySelector('.total-row');
                breakdownBox.insertBefore(discountRow, totalRow);
            }

            if (discountRow) {
                discountRow.innerHTML = `
                    <span>PWD/Senior Discount (${discountPercent}%)</span>
                    <span class="discount-price">-₱${this.discountAmount.toFixed(2)}</span>
                `;
            }
        } else if (discountRow) {
            discountRow.remove();
        }

        document.getElementById('paymentTotal').textContent = `₱${this.grandTotal.toFixed(2)}`;
    }

    bindEvents() {
        // Toggle Switch Event Listener
        const pwdToggle = document.getElementById('pwdDiscountToggle');
        const discountControls = document.getElementById('discountControls');

        pwdToggle?.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            if (discountControls) {
                discountControls.style.display = isChecked ? 'block' : 'none';
            }
            this.calculateTotals();
        });

        // Discount Percentage Input Event Listener
        const discountRateInput = document.getElementById('discountRateInput');
        discountRateInput?.addEventListener('input', () => {
            this.calculateTotals();
        });

        // Pay Button Event Listener
        const payBtn = document.getElementById('btnConfirmPay');
        payBtn?.addEventListener('click', () => {
            this.processPayment();
        });
    }

    processPayment() {
        const paymentSelect = document.getElementById('paymentMethodSelect');
        const selectedMethod = paymentSelect ? paymentSelect.value : 'cash';

        const pwdToggle = document.getElementById('pwdDiscountToggle');
        const isPwdApplied = pwdToggle ? pwdToggle.checked : false;

        const statusSelect = document.getElementById('paymentStatusSelect');
        if (statusSelect) {
            statusSelect.value = 'paid';
            statusSelect.classList.remove('status-unpaid');
            statusSelect.classList.add('status-paid');
        }

        const completedTransaction = {
            ...this.orderData,
            subtotal: this.subtotal,
            tax: this.taxAmount,
            pwdDiscountApplied: isPwdApplied,
            discountAmount: this.discountAmount,
            totalAmount: this.grandTotal,
            paymentMethod: selectedMethod,
            status: 'Paid',
            completedAt: new Date().toISOString()
        };

        console.log('Transaction Completed:', completedTransaction);

        localStorage.removeItem('foodhub_current_order');

        alert(`Payment successful via ${selectedMethod.toUpperCase()}. Total: ₱${this.grandTotal.toFixed(2)}`);

        window.location.href = 'orders.html';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const controller = new PaymentController();
    await controller.init();
});