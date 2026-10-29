import { OrderService } from '../services/OrderService.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { formatQuantity } from '../utils/format.js';

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
                        data-id="${order.id}"
                    >
                        View
                    </button>
                    <button
                        type="button"
                        class="btn-sm-edit"
                        data-id="${order.id}"
                        style="margin-left: 4px; padding: 4px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: #ffffff; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--primary);"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        class="btn-sm-delete"
                        data-id="${order.id}"
                        style="margin-left: 4px; padding: 4px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: #ffffff; font-size: 12px; font-weight: 600; cursor: pointer; color: #b91c1c;"
                    >
                        Delete
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

        // New Order button
        const newOrderBtn = document.getElementById('newOrderBtn');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => this.openNewOrderModal());
        }

        // View buttons (delegated event on table body)
        const ordersTableBody = document.getElementById('ordersTableBody');
        if (ordersTableBody) {
            ordersTableBody.addEventListener('click', (e) => {
                const viewBtn = e.target.closest('.btn-sm-view');
                if (viewBtn) {
                    const orderId = viewBtn.getAttribute('data-id');
                    this.openViewOrderModal(orderId);
                    return;
                }

                const editBtn = e.target.closest('.btn-sm-edit');
                if (editBtn) {
                    const orderId = editBtn.getAttribute('data-id');
                    this.openEditOrderModal(orderId);
                    return;
                }

                const deleteBtn = e.target.closest('.btn-sm-delete');
                if (deleteBtn) {
                    const orderId = deleteBtn.getAttribute('data-id');
                    this.confirmDeleteOrder(orderId);
                    return;
                }
            });
        }
    }

    // ===== MODAL HELPERS =====
    createModal(title, content, onConfirm = null) {
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
                    ${onConfirm ? `
                    <div class="modal-footer">
                        <button class="action-btn secondary" data-dismiss>Cancel</button>
                        <button class="action-btn primary" data-confirm>Confirm</button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Remove existing modal
        const existing = document.getElementById('orderModal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('orderModal');

        // Close handlers
        modal.querySelectorAll('[data-dismiss], .modal-close, .modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el || e.target.classList.contains('modal-close') || e.target.classList.contains('modal-overlay')) {
                    this.closeModal();
                }
            });
        });

        if (onConfirm) {
            modal.querySelector('[data-confirm]').addEventListener('click', () => {
                onConfirm(modal);
            });
        }

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

    // ===== NEW ORDER MODAL =====
    async openNewOrderModal() {
        // Fetch menu items for the order form
        let menuItems = [];
        try {
            const response = await this.orderService.fetchMenuItems();
            menuItems = response;
        } catch (e) {
            console.warn('Could not fetch menu items for new order:', e);
        }

        const menuOptions = menuItems.map(item =>
            `<option value="${item.id}" data-price="${item.price}">${item.name} - ₱${item.price}</option>`
        ).join('');

        const content = `
            <form id="newOrderForm">
                <div class="form-group">
                    <label>Order Type</label>
                    <select name="order_type">
                        <option value="DINE_IN">Dine In</option>
                        <option value="TAKEOUT">Takeout</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Payment Method</label>
                    <select name="payment_method">
                        <option value="CASH">Cash</option>
                        <option value="GCASH">GCash</option>
                        <option value="MAYA">Maya</option>
                        <option value="FOODPANDA">Foodpanda</option>
                    </select>
                </div>

                <h4 style="margin: 16px 0 8px;">Order Items</h4>
                <div id="orderItemsContainer">
                    <div class="order-item-row">
                        <select name="menu_item[]" class="item-select" required>
                            <option value="">Select Menu Item</option>
                            ${menuOptions}
                        </select>
                        <input type="number" name="quantity[]" class="item-qty" value="1" min="1" max="99" required>
                        <span class="item-price">₱0.00</span>
                        <button type="button" class="btn-remove-item" aria-label="Remove item">&times;</button>
                    </div>
                </div>
                <button type="button" class="action-btn secondary btn-sm" id="addItemBtn">+ Add Item</button>

                <div class="order-total" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color); text-align: right;">
                    <strong>Total: <span id="orderTotal">₱0.00</span></strong>
                </div>
            </form>
        `;

        this.createModal('New Order', content, async (modal) => {
            const form = modal.querySelector('#newOrderForm');
            const formData = new FormData(form);

            // Build items array
            const items = [];
            form.querySelectorAll('.order-item-row').forEach(row => {
                const menuItemId = row.querySelector('select[name="menu_item[]"]').value;
                const quantity = parseInt(row.querySelector('input[name="quantity[]"]').value) || 1;
                if (menuItemId) {
                    items.push({ menu_item: parseInt(menuItemId), quantity });
                }
            });

            if (items.length === 0) {
                alert('Please add at least one item');
                return;
            }

            const orderData = {
                order_type: formData.get('order_type') || 'DINE_IN',
                payment_method: formData.get('payment_method') || 'CASH',
                items: items
            };

            try {
                await this.orderService.createOrder(orderData);
                this.closeModal();
                await this.loadOrders();
                this.loadStatistics();
            } catch (error) {
                console.error('Failed to create order:', error);
                alert('Failed to create order: ' + error.message);
            }
        });

        // Add dynamic behavior to the modal
        this.setupNewOrderModalBehavior();
    }

    setupNewOrderModalBehavior() {
        const modal = document.getElementById('orderModal');
        if (!modal) return;

        // Add item row
        const addItemBtn = modal.querySelector('#addItemBtn');
        const container = modal.querySelector('#orderItemsContainer');
        if (addItemBtn && container) {
            addItemBtn.addEventListener('click', () => {
                const row = document.createElement('div');
                row.className = 'order-item-row';
                row.innerHTML = `
                    <select name="menu_item[]" class="item-select" required>
                        <option value="">Select Menu Item</option>
                        ${container.querySelector('.item-select').innerHTML}
                    </select>
                    <input type="number" name="quantity[]" class="item-qty" value="1" min="1" max="99" required>
                    <span class="item-price">₱0.00</span>
                    <button type="button" class="btn-remove-item" aria-label="Remove item">&times;</button>
                `;
                container.appendChild(row);
                this.bindItemRowEvents(row);
                this.updateOrderTotal();
            });
        }

        // Bind events to existing rows
        container?.querySelectorAll('.order-item-row').forEach(row => this.bindItemRowEvents(row));
    }

    bindItemRowEvents(row) {
        const select = row.querySelector('.item-select');
        const qty = row.querySelector('.item-qty');
        const removeBtn = row.querySelector('.btn-remove-item');

        const updatePrice = () => {
            const option = select.selectedOptions[0];
            const price = option ? parseFloat(option.dataset.price) || 0 : 0;
            const quantity = parseInt(qty.value) || 1;
            row.querySelector('.item-price').textContent = '₱' + (price * quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 });
            this.updateOrderTotal();
        };

        select?.addEventListener('change', updatePrice);
        qty?.addEventListener('input', updatePrice);
        removeBtn?.addEventListener('click', () => {
            const container = document.getElementById('orderItemsContainer');
            if (container.querySelectorAll('.order-item-row').length > 1) {
                row.remove();
                this.updateOrderTotal();
            } else {
                // Just reset the first row
                select.value = '';
                qty.value = 1;
                updatePrice();
            }
        });
    }

    updateOrderTotal() {
        const modal = document.getElementById('orderModal');
        if (!modal) return;

        let total = 0;
        modal.querySelectorAll('.order-item-row').forEach(row => {
            const option = row.querySelector('.item-select').selectedOptions[0];
            const price = option ? parseFloat(option.dataset.price) || 0 : 0;
            const quantity = parseInt(row.querySelector('.item-qty').value) || 1;
            total += price * quantity;
        });

        const totalEl = modal.querySelector('#orderTotal');
        if (totalEl) totalEl.textContent = '₱' + total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ===== VIEW ORDER MODAL =====
    async openViewOrderModal(orderId) {
        try {
            const order = await this.orderService.fetchOrderById(orderId);
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

                    <!-- Action Buttons -->
                    <div class="order-detail-actions" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; gap: 8px; justify-content: flex-end;">
                        <button type="button" class="action-btn secondary" data-action="edit" style="padding: 8px 16px; font-size: 13px;">
                            Edit
                        </button>
                        <button type="button" class="action-btn secondary" data-action="update-status" style="padding: 8px 16px; font-size: 13px;">
                            Update Status
                        </button>
                        <button type="button" class="action-btn secondary" data-action="delete" style="padding: 8px 16px; font-size: 13px; color: #b91c1c; border-color: #fecaca;">
                            Delete
                        </button>
                    </div>
                </div>
            `;

            const modal = this.createModal('Order Details', content);

            // Add event listeners for action buttons
            modal.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.getAttribute('data-action');
                    this.closeModal();
                    if (action === 'edit') {
                        this.openEditOrderModal(orderId);
                    } else if (action === 'update-status') {
                        this.openQuickStatusUpdate(orderId, order.status);
                    } else if (action === 'delete') {
                        this.confirmDeleteOrder(orderId);
                    }
                });
            });

        } catch (error) {
            console.error('Failed to load order details:', error);
            alert('Failed to load order details');
        }
    }

    // ===== QUICK STATUS UPDATE =====
    openQuickStatusUpdate(orderId, currentStatus) {
        const statuses = ['PENDING', 'PROCESSING', 'COMPLETED'];
        const statusOptions = statuses.map(s =>
            `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s.charAt(0) + s.slice(1).toLowerCase()}</option>`
        ).join('');

        const content = `
            <form id="quickStatusForm">
                <div class="form-group">
                    <label>New Status</label>
                    <select name="status">
                        ${statusOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Payment Status</label>
                    <select name="payment_status">
                        <option value="UNPAID">Unpaid</option>
                        <option value="PAID">Paid</option>
                    </select>
                </div>
            </form>
        `;

        this.createModal('Update Order Status', content, async (modal) => {
            const form = modal.querySelector('#quickStatusForm');
            const formData = new FormData(form);

            const updateData = {
                status: formData.get('status'),
                payment_status: formData.get('payment_status')
            };

            try {
                await this.orderService.updateOrder(orderId, updateData);
                this.closeModal();
                await this.loadOrders();
                this.loadStatistics();
            } catch (error) {
                console.error('Failed to update order status:', error);
                alert('Failed to update order status: ' + error.message);
            }
        });
    }

    // ===== EDIT ORDER MODAL =====
    async openEditOrderModal(orderId) {
        try {
            const order = await this.orderService.fetchOrderById(orderId);
            if (!order) {
                alert('Order not found');
                return;
            }

            const content = `
                <form id="editOrderForm">
                    <input type="hidden" name="order_id" value="${order.id}">

                    <div class="form-group">
                        <label>Order Type</label>
                        <select name="order_type">
                            <option value="DINE_IN" ${order.order_type === 'DINE_IN' ? 'selected' : ''}>Dine In</option>
                            <option value="TAKEOUT" ${order.order_type === 'TAKEOUT' ? 'selected' : ''}>Takeout</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="PENDING" ${order.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                            <option value="PROCESSING" ${order.status === 'PROCESSING' ? 'selected' : ''}>Processing</option>
                            <option value="COMPLETED" ${order.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Payment Status</label>
                        <select name="payment_status">
                            <option value="UNPAID" ${order.payment_status === 'UNPAID' ? 'selected' : ''}>Unpaid</option>
                            <option value="PAID" ${order.payment_status === 'PAID' ? 'selected' : ''}>Paid</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Payment Method</label>
                        <select name="payment_method">
                            <option value="CASH" ${order.payment_method === 'CASH' ? 'selected' : ''}>Cash</option>
                            <option value="GCASH" ${order.payment_method === 'GCASH' ? 'selected' : ''}>GCash</option>
                            <option value="MAYA" ${order.payment_method === 'MAYA' ? 'selected' : ''}>Maya</option>
                            <option value="FOODPANDA" ${order.payment_method === 'FOODPANDA' ? 'selected' : ''}>Foodpanda</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" rows="3">${order.notes || ''}</textarea>
                    </div>
                </form>
            `;

            this.createModal('Edit Order', content, async (modal) => {
                const form = modal.querySelector('#editOrderForm');
                const formData = new FormData(form);

                const updateData = {
                    order_type: formData.get('order_type'),
                    status: formData.get('status'),
                    payment_status: formData.get('payment_status'),
                    payment_method: formData.get('payment_method'),
                    notes: formData.get('notes') || ''
                };

                try {
                    await this.orderService.updateOrder(orderId, updateData);
                    this.closeModal();
                    await this.loadOrders();
                    this.loadStatistics();
                } catch (error) {
                    console.error('Failed to update order:', error);
                    alert('Failed to update order: ' + error.message);
                }
            });

        } catch (error) {
            console.error('Failed to load order for editing:', error);
            alert('Failed to load order for editing');
        }
    }

    // ===== DELETE ORDER =====
    confirmDeleteOrder(orderId) {
        const content = `
            <div style="text-align: center; padding: 20px;">
                <svg xmlns="http://w3.org" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3 style="margin-bottom: 8px; color: var(--slate-dark);">Delete Order?</h3>
                <p style="color: var(--slate-muted); margin-bottom: 20px;">This action cannot be undone. The order will be permanently removed.</p>
                <p style="color: var(--primary); font-weight: 600;">Order ID: ${orderId}</p>
            </div>
        `;

        this.createModal('Confirm Delete', content, async (modal) => {
            try {
                await this.orderService.deleteOrder(orderId);
                this.closeModal();
                await this.loadOrders();
                this.loadStatistics();
            } catch (error) {
                console.error('Failed to delete order:', error);
                alert('Failed to delete order: ' + error.message);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OrdersController();
    loadSidebarNav();
    loadTopNavbar();
});
