import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { apiPost, apiPatch, apiGet } from '../utils/api.js';

/**
 * FOODHUB
 * Payment Controller
 * Handles payment processing and order creation via Django API.
 */
class PaymentController {
    constructor() {
        this.cartData = this.getSavedCartData();
        this.subtotal = 0;
        this.taxAmount = 0;
        this.discountAmount = 0;
        this.grandTotal = 0;
        this.editOrderId = sessionStorage.getItem('editOrderId');
        this.isEditMode = !!this.editOrderId;
        console.log('PaymentController constructor - editOrderId from sessionStorage:', this.editOrderId, 'isEditMode:', this.isEditMode, 'cart items:', this.cartData.items.length);
    }

    getSavedCartData() {
        try {
            const raw = sessionStorage.getItem('foodhub_cart_for_payment');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error('Failed to load cart data from sessionStorage', e);
        }

        // Fallback - should not happen in normal flow
        return {
            orderType: 'Takeout',
            items: []
        };
    }

    async init() {
        loadSidebarNav();
        loadTopNavbar();

        console.log('PaymentController constructor - editOrderId from sessionStorage:', this.editOrderId, 'isEditMode:', this.isEditMode, 'cart items:', this.cartData.items.length);

        if (this.cartData.items.length === 0) {
            alert('No items in cart. Redirecting to POS...');
            window.location.href = 'orders.html';
            return;
        }

        // If in edit mode, load the existing order data to populate form fields
        if (this.isEditMode) {
            await this.loadExistingOrder();
        }

        this.renderOrderSummary();
        this.bindEvents();
    }

    async loadExistingOrder() {
        try {
            const response = await apiGet(`/orders/orders/${this.editOrderId}/`);
            // Populate form fields with existing order data
            document.getElementById('orderIdText').textContent = response.order_number;

            // Set payment method
            const paymentSelect = document.getElementById('paymentMethodSelect');
            if (paymentSelect) {
                const methodMap = {
                    'CASH': 'cash',
                    'GCASH': 'gcash',
                    'MAYA': 'maya',
                    'FOODPANDA': 'foodpanda'
                };
                paymentSelect.value = methodMap[response.payment_method] || 'cash';
                paymentSelect.setAttribute('data-selected', paymentSelect.value);
            }

            // Set payment status
            const statusSelect = document.getElementById('paymentStatusSelect');
            if (statusSelect) {
                const statusMap = {
                    'PAID': 'paid',
                    'UNPAID': 'unpaid'
                };
                statusSelect.value = statusMap[response.payment_status] || 'unpaid';
            }

            // Set discount if any
            if (response.discount_amount && parseFloat(response.discount_amount) > 0) {
                const pwdToggle = document.getElementById('pwdDiscountToggle');
                const discountControls = document.getElementById('discountControls');
                const discountRateInput = document.getElementById('discountRateInput');

                if (pwdToggle && discountControls && discountRateInput) {
                    // Calculate discount percentage
                    const subtotal = parseFloat(response.subtotal);
                    const discountAmount = parseFloat(response.discount_amount);
                    const discountPercent = subtotal > 0 ? (discountAmount / subtotal * 100).toFixed(2) : 0;

                    pwdToggle.checked = true;
                    discountControls.style.display = 'block';
                    discountRateInput.value = discountPercent;
                }
            }
        } catch (error) {
            console.error('Failed to load existing order:', error);
        }
    }

    renderOrderSummary() {
        // In edit mode, show the existing order number
        if (this.isEditMode && this.cartData.originalOrder) {
            document.getElementById('orderIdText').textContent = this.cartData.originalOrder.order_number;

            // Show order timestamp in Manila timezone
            const createdAt = new Date(this.cartData.originalOrder.created_at || this.cartData.originalOrder.createdAt);
            document.getElementById('orderTimestamp').textContent = createdAt.toLocaleDateString('en-US', {
                timeZone: 'Asia/Manila',
                month: 'short', day: 'numeric', year: 'numeric'
            }) + ' • ' + createdAt.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Manila',
                hour: '2-digit', minute: '2-digit'
            });
        } else {
            document.getElementById('orderIdText').textContent = 'NEW ORDER';
            document.getElementById('orderTimestamp').textContent = new Date().toLocaleDateString('en-US', {
                timeZone: 'Asia/Manila',
                month: 'short', day: 'numeric', year: 'numeric'
            }) + ' • ' + new Date().toLocaleTimeString('en-US', {
                timeZone: 'Asia/Manila',
                hour: '2-digit', minute: '2-digit'
            });
        }

        const orderTypeBadge = document.getElementById('orderTypeBadge');
        if (orderTypeBadge) {
            orderTypeBadge.textContent = this.cartData.orderType || 'Takeout';
        }

        const tableBody = document.getElementById('paymentTableBody');
        if (!tableBody) return;

        this.subtotal = 0;
        const rows = this.cartData.items.map(item => {
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

        // Back Button - save current data to POS cart format and navigate to POS
        const backBtn = document.querySelector('.btn-back');
        backBtn?.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link navigation

            // Save current cart data (with any edits) to POS cart format
            const posCartData = {
                orderType: this.cartData.orderType || 'Takeout',
                items: this.cartData.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image || ''  // Preserve image URL for POS display
                }))
            };
            sessionStorage.setItem('foodhub_cart_for_payment', JSON.stringify(posCartData));

            // editOrderId is already in sessionStorage from edit mode - preserve it
            // Go to POS page (orders.html) with items loaded
            window.location.href = 'orders.html';
        });
    }

    async processPayment() {
        const paymentSelect = document.getElementById('paymentMethodSelect');
        const selectedMethod = paymentSelect ? paymentSelect.value : 'cash';

        const pwdToggle = document.getElementById('pwdDiscountToggle');
        const isPwdApplied = pwdToggle ? pwdToggle.checked : false;

        // Get payment status from dropdown
        const statusSelect = document.getElementById('paymentStatusSelect');
        const paymentStatus = statusSelect ? statusSelect.value : 'unpaid';

        console.log('processPayment called - isEditMode:', this.isEditMode, 'editOrderId:', this.editOrderId);

        // Map order type to Django choices (DINE_IN, TAKEOUT)
        const orderTypeMap = {
            'Dine In': 'DINE_IN',
            'Dine-in': 'DINE_IN',
            'Takeout': 'TAKEOUT',
            'DINE_IN': 'DINE_IN',
            'TAKEOUT': 'TAKEOUT'
        };
        const orderType = orderTypeMap[this.cartData.orderType] || 'TAKEOUT';

        // Map payment method to Django choices (CASH, GCASH, MAYA, FOODPANDA)
        const paymentMethodMap = {
            'cash': 'CASH',
            'gcash': 'GCASH',
            'maya': 'MAYA',
            'foodpanda': 'FOODPANDA',
            'Cash': 'CASH',
            'Gcash': 'GCASH',
            'Maya': 'MAYA',
            'Foodpanda': 'FOODPANDA'
        };
        const paymentMethod = paymentMethodMap[selectedMethod] || 'CASH';

        // Map payment status to Django choices (PAID, UNPAID)
        const paymentStatusMap = {
            'paid': 'PAID',
            'unpaid': 'UNPAID'
        };
        const djangoPaymentStatus = paymentStatusMap[paymentStatus] || 'UNPAID';

        // Disable pay button to prevent double submission
        const payBtn = document.getElementById('btnConfirmPay');
        const btnText = this.isEditMode ? 'Updating...' : 'Processing...';
        if (payBtn) {
            payBtn.disabled = true;
            payBtn.textContent = btnText;
        }

        try {
            // Prepare order payload for Django API
            const orderPayload = {
                order_type: orderType,
                items: this.cartData.items.map(item => ({
                    menu_item: item.id,
                    quantity: item.quantity,
                    notes: ''
                })),
                payment_method: paymentMethod,
                discount_amount: this.discountAmount.toFixed(2),
                tax_amount: this.taxAmount.toFixed(2)
            };

            // Only include payment_status in edit mode (OrderCreateSerializer doesn't accept it)
            orderPayload.payment_status = djangoPaymentStatus;
            

            console.log(this.isEditMode ? 'Updating order via API:' : 'Creating order via API:', orderPayload);

            let response;
            if (this.isEditMode) {
                // Update existing order using the update_details endpoint
                response = await apiPatch(`/orders/orders/${this.editOrderId}/update_details/`, orderPayload);
            } else {
                // Create new order using POST
                response = await apiPost('/orders/orders/', orderPayload);
            }

            console.log(this.isEditMode ? 'Order updated successfully:' : 'Order created successfully:', response);

            // Clear cart and edit mode from sessionStorage
            sessionStorage.removeItem('foodhub_cart_for_payment');
            sessionStorage.removeItem('editOrderId');

            // Show success message
            const orderNumber = response.order_number || response.id;
            const action = this.isEditMode ? 'updated' : 'created';
            alert(`Payment successful via ${selectedMethod.toUpperCase()}! Order #${orderNumber} ${action}. Total: ₱${this.grandTotal.toFixed(2)}`);

            // Redirect back to POS
            window.location.href = 'orders.html';

        } catch (error) {
            console.error(this.isEditMode ? 'Update failed:' : 'Payment failed:', error);
            alert(`${this.isEditMode ? 'Update' : 'Payment'} failed: ${error.message}`);

            // Re-enable pay button
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.textContent = this.isEditMode ? 'Update Order' : 'Confirm Payment';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const controller = new PaymentController();
    await controller.init();
});