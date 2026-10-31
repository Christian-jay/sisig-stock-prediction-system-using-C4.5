import { TodaysOrdersService } from '../services/TodaysOrdersService.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { apiGet, apiPatch, apiDelete } from '../utils/api.js';

export class TodaysOrdersController {
    constructor() {
        this.todaysOrdersService = new TodaysOrdersService();
        this.currentPage = 1;
        this.pageSize = 10; // 10 items per page
        this.currentOrderDbId = null; // Store current order DB ID for edit/update/delete

        this.initLayout();

        this.loadOrders();


        this.initEventListeners();
    }

    /**
     * Get today's date in YYYY-MM-DD format in Manila timezone (Asia/Manila)
     * to match backend order number generation
     */
    getTodayDateString() {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    }

    initLayout() {

        loadSidebarNav();


        loadTopNavbar();


        const dateInput = document.getElementById('orderDateFilter');
        if (dateInput) {
            // Set default to today (local date)
            dateInput.value = this.getTodayDateString();
        }

        // Add pagination container if not exists
        this.ensurePaginationContainer();

    }

    ensurePaginationContainer() {
        const tableCard = document.querySelector('.table-card');
        if (tableCard && !document.getElementById('paginationContainer')) {
            const paginationDiv = document.createElement('div');
            paginationDiv.id = 'paginationContainer';
            paginationDiv.className = 'pagination-container';
            paginationDiv.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                border-top: 1px solid var(--slate-200);
                flex-wrap: wrap;
                gap: 12px;
            `;
            paginationDiv.innerHTML = `
                <div id="paginationInfo" class="pagination-info" style="font-size: 14px; color: var(--slate-600);">
                    Showing 0 of 0 orders
                </div>
                <div id="paginationButtons" class="pagination-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <!-- Buttons injected here -->
                </div>
            `;
            tableCard.appendChild(paginationDiv);
        }
    }

    async loadOrders() {
        const tableBody = document.getElementById('ordersTableBody');
        const selectedDate = document.getElementById('orderDateFilter').value;

        // Show loading state
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted" style="padding: 30px;">
                        Loading transactions...
                    </td>
                </tr>
            `;
        }

        try {
            const result = await this.todaysOrdersService.getOrdersByDate(
                selectedDate,
                this.currentPage,
                this.pageSize
            );

            const stats = this.todaysOrdersService.calculateStats(result.orders);
            this.updateStats(stats);
            this.renderOrdersTable(result.orders);
            this.renderPagination(result.pagination);
        } catch (error) {
            console.error('Failed to load orders:', error);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted" style="padding: 30px;">
                            Failed to load orders. Please try again.
                        </td>
                    </tr>
                `;
            }
        }
    }

    renderOrdersTable(orders) {
        const tableBody = document.getElementById('ordersTableBody');
        if (!tableBody) return;

        if (orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted" style="padding: 30px;">
                        No orders found for ${document.getElementById('orderDateFilter').value}.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = orders.map(order => {
            const orderId = order.id || '#1001';
            const timestamp = order.timestamp || 'N/A';
            const total = order.total || 0;
            const status = order.status || 'pending';
            const itemsList = order.getItemsSummary ? order.getItemsSummary() : 'Standard Meal';

            // Choose badge class based on status
            let statusBadgeClass = 'badge-pending';
            const stLower = status.toLowerCase();
            if (stLower === 'completed') statusBadgeClass = 'badge-completed';
            else if (stLower === 'processing') statusBadgeClass = 'badge-processing';

            return `
                <tr>
                    <td><strong>${orderId}</strong></td>
                    <td><span class="text-muted">${timestamp}</span></td>
                    <td>${itemsList}</td>
                    <td><strong>${TodaysOrdersService.formatCurrency(total)}</strong></td>
                    <td><span class="badge-status ${statusBadgeClass}">${status.toUpperCase()}</span></td>
                    <td class="text-center">
                        <div class="action-btn-group">
                            <button class="btn-action btn-view" onclick="window.viewOrderDetails('${orderId}', '${order.dbId}')">
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
        document.getElementById('statTotalRevenue').textContent = TodaysOrdersService.formatCurrency(stats.totalRevenue);
    }

    renderPagination(pagination) {
        const infoEl = document.getElementById('paginationInfo');
        const buttonsEl = document.getElementById('paginationButtons');

        if (!infoEl || !buttonsEl) return;

        const { count, totalPages, currentPage, pageSize } = pagination;
        const start = count === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const end = Math.min(currentPage * pageSize, count);

        infoEl.textContent = count > 0
            ? `Showing ${start}-${end} of ${count} orders`
            : 'Showing 0 of 0 orders';

        if (totalPages <= 1) {
            buttonsEl.innerHTML = '';
            return;
        }

        let buttonsHtml = '';

        // Previous button
        buttonsHtml += `
            <button class="btn-page ${currentPage === 1 ? 'disabled' : ''}"
                    id="prevPageBtn"
                    ${currentPage === 1 ? 'disabled' : ''}
                    style="padding: 8px 16px; border: 1px solid var(--slate-300); background: white; border-radius: 6px; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'}; opacity: ${currentPage === 1 ? '0.5' : '1'};">
                ← Prev
            </button>
        `;

        // Page numbers (show max 5 pages around current)
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttonsHtml += `
                <button class="btn-page ${i === currentPage ? 'active' : ''}"
                        data-page="${i}"
                        style="padding: 8px 14px; border: 1px solid var(--slate-300); background: ${i === currentPage ? 'var(--primary)' : 'white'}; color: ${i === currentPage ? 'white' : 'var(--slate-700)'}; border-radius: 6px; cursor: pointer; min-width: 40px;">
                    ${i}
                </button>
            `;
        }

        // Next button
        buttonsHtml += `
            <button class="btn-page ${currentPage === totalPages ? 'disabled' : ''}"
                    id="nextPageBtn"
                    ${currentPage === totalPages ? 'disabled' : ''}
                    style="padding: 8px 16px; border: 1px solid var(--slate-300); background: white; border-radius: 6px; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'}; opacity: ${currentPage === totalPages ? '0.5' : '1'};">
                Next →
            </button>
        `;

        buttonsEl.innerHTML = buttonsHtml;

        // Bind page button events
        buttonsEl.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentPage = parseInt(btn.dataset.page);
                this.loadOrders();
            });
        });

        const prevBtn = document.getElementById('prevPageBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadOrders();
                }
            });
        }

        const nextBtn = document.getElementById('nextPageBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.loadOrders();
                }
            });
        }
    }

    /**
     * Fetch full order details from API and show in modal
     */
    async viewOrderDetails(orderId, dbId) {
        // Store dbId for edit/update/delete operations
        this.currentOrderDbId = dbId;

        const modal = document.getElementById('viewOrderModal');
        console.log('viewOrderModal found:', !!modal);
        if (modal) {
            console.log('viewOrderModal element:', modal);
        }
        if (!modal) return;

        // Show loading state in modal
        this.showModalLoading(true);
        modal.style.display = 'flex';

        try {
            // Fetch full order details from API using dbId (database ID)
            const order = await apiGet(`/orders/orders/${dbId}/`);
            this.populateModal(order);
        } catch (error) {
            console.error('Failed to fetch order details:', error);
            this.showModalError('Failed to load order details');
        } finally {
            this.showModalLoading(false);
        }
    }

    /**
     * Populate modal with order data
     */
    populateModal(order) {
        // Helper to safely set textContent
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
            else console.warn(`Modal element not found: ${id}`);
        };

        const setHtml = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = value;
            else console.warn(`Modal element not found: ${id}`);
        };

        // Order header
        setText('modalOrderId', order.order_number || `#${order.id}`);

        // Format date in Manila timezone to match backend order number generation
        const createdAt = new Date(order.created_at);
        const formattedDate = createdAt.toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila',
            month: 'short', day: 'numeric', year: 'numeric'
        });
        const formattedTime = createdAt.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Manila',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
        setText('modalOrderDate', `${formattedDate} • ${formattedTime}`);

        // Status badge
        const statusEl = document.getElementById('modalOrderStatus');
        if (statusEl) {
            statusEl.textContent = order.status_display || order.status;
            statusEl.className = 'badge-status';
            const statusLower = (order.status || '').toLowerCase();
            if (statusLower === 'completed') statusEl.classList.add('badge-completed');
            else if (statusLower === 'processing') statusEl.classList.add('badge-processing');
            else statusEl.classList.add('badge-pending');
        }

        // Order info
        setText('modalOrderType',
            order.order_type === 'DINE_IN' ? 'Dine In' :
            order.order_type === 'TAKEOUT' ? 'Takeout' : order.order_type);
        setText('modalPaymentMethod', order.payment_method_display || order.payment_method);
        setText('modalCashier', order.created_by_name || '—');
        setText('modalPaymentStatus',
            order.payment_status === 'PAID' ? 'Paid' : 'Unpaid');

        // Items
        const itemsList = document.getElementById('modalItemsList');
        const items = order.items || [];
        if (itemsList) {
            if (items.length === 0) {
                itemsList.innerHTML = '<p class="text-muted" style="text-align: center; padding: 20px;">No items</p>';
            } else {
                itemsList.innerHTML = items.map(item => `
                    <div class="order-item">
                        <div class="order-item-info">
                            <div class="order-item-name">${item.menu_item_name}</div>
                            <div class="order-item-details">Qty: ${item.quantity} × ${TodaysOrdersService.formatCurrency(item.unit_price)}</div>
                            ${item.notes ? `<div class="order-item-notes">${item.notes}</div>` : ''}
                        </div>
                        <div class="order-item-total">
                            ${TodaysOrdersService.formatCurrency(item.line_total)}
                        </div>
                    </div>
                `).join('');
            }
        }

        // Totals
        setText('modalSubtotal', TodaysOrdersService.formatCurrency(order.subtotal));
        setText('modalTax', TodaysOrdersService.formatCurrency(order.tax_amount));

        const discountRow = document.getElementById('modalDiscountRow');
        const discount = parseFloat(order.discount_amount) || 0;
        if (discountRow) {
            if (discount > 0) {
                discountRow.style.display = 'flex';
                setText('modalDiscount', `-${TodaysOrdersService.formatCurrency(discount)}`);
            } else {
                discountRow.style.display = 'none';
            }
        }

        setText('modalTotal', TodaysOrdersService.formatCurrency(order.total_amount));
    }

    showModalLoading(show) {
        const modal = document.getElementById('viewOrderModal');
        if (!modal) return;

        const body = modal.querySelector('.modal-body');
        let overlay = body.querySelector('.modal-loading-overlay');

        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'modal-loading-overlay';
                overlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: var(--modal-backdrop);
                    z-index: 10;
                    border-radius: inherit;
                `;
                overlay.innerHTML = `
                    <div class="spinner" style="width: 32px; height: 32px; border: 3px solid var(--border-color); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                `;
                // Make body relative positioned for absolute overlay
                body.style.position = 'relative';
                body.appendChild(overlay);
            }
            overlay.style.display = 'flex';
        } else if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showModalError(message) {
        const modal = document.getElementById('viewOrderModal');
        if (!modal) return;

        const body = modal.querySelector('.modal-body');
        // Hide any existing content and show error
        const overlay = body.querySelector('.modal-loading-overlay');
        if (overlay) overlay.style.display = 'none';

        // Create or reuse error overlay
        let errorOverlay = body.querySelector('.modal-error-overlay');
        if (!errorOverlay) {
            errorOverlay = document.createElement('div');
            errorOverlay.className = 'modal-error-overlay';
            errorOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: rgba(255, 255, 255, 0.95);
                z-index: 10;
                border-radius: inherit;
                color: var(--red-600);
                padding: 20px;
                text-align: center;
            `;
            body.style.position = 'relative';
            body.appendChild(errorOverlay);
        }
        errorOverlay.innerHTML = `<p>${message}</p>`;
        errorOverlay.style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('viewOrderModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Ensure modal exists in DOM - create dynamically if missing
     */
    ensureModalExists() {
        let modal = document.getElementById('viewOrderModal');

        if (!modal) {
            console.log('Creating modal dynamically...');

            const modalHTML = `
            <div id="viewOrderModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle" style="display: none;">
                <div class="modal-container" style="max-width: 600px;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color);">
                        <h3 id="modalTitle" style="margin: 0; font-size: 18px;">Order Details</h3>
                        <button type="button" class="modal-close" id="modalCloseBtn" aria-label="Close modal" style="background: none; border: none; cursor: pointer; padding: 4px; color: var(--slate-muted);">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                        <div class="order-detail-header" style="padding: 16px; border-bottom: 1px solid var(--border-color);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                <div>
                                    <h4 id="modalOrderId" style="margin: 0; font-size: 18px;">#ORD-0000</h4>
                                    <span id="modalOrderDate" class="text-muted" style="font-size: 14px;">Date • Time</span>
                                </div>
                                <span id="modalOrderStatus" class="badge-status badge-pending" style="font-size: 12px; padding: 4px 12px;">PENDING</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 14px;">
                                <div><strong>Type:</strong> <span id="modalOrderType">Dine In</span></div>
                                <div><strong>Payment:</strong> <span id="modalPaymentMethod">Cash</span></div>
                                <div><strong>Cashier:</strong> <span id="modalCashier">—</span></div>
                                <div><strong>Status:</strong> <span id="modalPaymentStatus">Paid</span></div>
                            </div>
                        </div>
                        <div class="order-detail-items" style="padding: 16px;">
                            <h5 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: var(--slate-muted);">Items</h5>
                            <div id="modalItemsList" style="display: flex; flex-direction: column; gap: 8px;"></div>
                        </div>
                        <div class="order-detail-totals" style="padding: 16px; border-top: 1px solid var(--border-color); background: var(--bg-main);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                <span>Subtotal</span>
                                <span id="modalSubtotal">₱0.00</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                <span>Tax (12%)</span>
                                <span id="modalTax">₱0.00</span>
                            </div>
                            <div id="modalDiscountRow" style="display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--red-600);">
                                <span>Discount</span>
                                <span id="modalDiscount">-₱0.00</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; padding-top: 8px; border-top: 1px solid var(--border-color);">
                                <span>Total</span>
                                <span id="modalTotal">₱0.00</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap;">
                        <button type="button" class="btn-secondary" id="modalCloseBtn2" style="padding: 10px 16px; border: 1px solid var(--border-color); background: white; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">Close</button>
                        <button type="button" class="btn-secondary" id="modalEditBtn" style="padding: 10px 16px; border: 1px solid var(--border-color); background: white; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--primary);">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                        </button>
                        <button type="button" class="btn-warning" id="modalStatusBtn" style="padding: 10px 16px; border: none; background: var(--warning-bg); color: var(--warning-text); border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Update Status
                        </button>
                        <button type="button" class="btn-danger" id="modalDeleteBtn" style="padding: 10px 16px; border: none; background: #fee2e2; color: #dc2626; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('viewOrderModal');
    }

    // Always bind events (works for both dynamic and HTML modals)
    this.bindModalEvents();
    }

    /**
     * Bind event listeners for modal elements
     */
    bindModalEvents() {
        const modal = document.getElementById('viewOrderModal');
        if (!modal) return;

        // Close on X button
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Close on Close button in footer
        const closeBtn2 = document.getElementById('modalCloseBtn2');
        if (closeBtn2) {
            closeBtn2.addEventListener('click', () => this.closeModal());
        }

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Edit button
        const editBtn = document.getElementById('modalEditBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editOrder());
        }

        // Update Status button
        const statusBtn = document.getElementById('modalStatusBtn');
        if (statusBtn) {
            statusBtn.addEventListener('click', () => this.updateOrderStatus());
        }

        // Delete button
        const deleteBtn = document.getElementById('modalDeleteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteOrder());
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                this.closeModal();
            }
        });
    }

    printReceipt() {
        // Create print-friendly version
        const modal = document.getElementById('viewOrderModal');
        if (!modal) return;

        const orderId = document.getElementById('modalOrderId').textContent;
        const orderDate = document.getElementById('modalOrderDate').textContent;
        const orderType = document.getElementById('modalOrderType').textContent;
        const paymentMethod = document.getElementById('modalPaymentMethod').textContent;
        const subtotal = document.getElementById('modalSubtotal').textContent;
        const tax = document.getElementById('modalTax').textContent;
        const discount = document.getElementById('modalDiscount').textContent;
        const total = document.getElementById('modalTotal').textContent;

        const itemsHtml = document.getElementById('modalItemsList').innerHTML;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${orderId}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .header h2 { margin: 0; font-size: 20px; }
                    .header p { margin: 4px 0; font-size: 12px; color: #666; }
                    .info { display: grid; grid-template-columns: 1fr 1fr; font-size: 13px; margin-bottom: 15px; }
                    .info div { padding: 2px 0; }
                    .items { border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 10px 0; }
                    .item { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
                    .totals { margin-top: 15px; font-size: 13px; }
                    .totals div { display: flex; justify-content: space-between; padding: 3px 0; }
                    .totals .total { font-weight: bold; font-size: 15px; border-top: 1px solid #333; padding-top: 8px; margin-top: 5px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>FOODHUB</h2>
                    <p>Official Receipt</p>
                </div>
                <div class="info">
                    <div><strong>Order:</strong> ${orderId}</div>
                    <div><strong>Date:</strong> ${orderDate}</div>
                    <div><strong>Type:</strong> ${orderType}</div>
                    <div><strong>Payment:</strong> ${paymentMethod}</div>
                </div>
                <div class="items">
                    ${itemsHtml}
                </div>
                <div class="totals">
                    <div><span>Subtotal:</span> <span>${subtotal}</span></div>
                    <div><span>Tax (12%):</span> <span>${tax}</span></div>
                    ${discount && discount !== '-₱0.00' ? `<div><span>Discount:</span> <span>${discount}</span></div>` : ''}
                    <div class="total"><span>Total:</span> <span>${total}</span></div>
                </div>
                <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
                    <p>Thank you for dining with us!</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
    }

    /**
     * Edit order - fetch order data, convert to cart format, navigate to payment page
     */
    async editOrder() {
        const dbId = this.currentOrderDbId;
        if (!dbId) {
            console.error('No order ID for editing');
            return;
        }

        try {
            this.showModalLoading(true);

            // Fetch full order details from API
            const response = await apiGet(`/orders/orders/${dbId}/`);

            // Convert order items to cart format expected by PaymentController
            // Use original unit_price from order (not current menu price) to preserve discount calculation
            const cartItems = response.items.map(item => ({
                id: item.menu_item.id,
                name: item.menu_item.name,
                price: parseFloat(item.unit_price),  // Use original order price, not current menu price
                quantity: item.quantity,
                image: item.menu_item.image_url || item.menu_item.image || ''  // Use absolute URL for POS display
            }));

            // Prepare cart data in the format PaymentController expects
            const cartData = {
                orderType: response.order_type === 'DINE_IN' ? 'Dine In' : 'Takeout',
                items: cartItems,
                // Store original order data for reference
                originalOrder: {
                    id: response.id,
                    order_number: response.order_number,
                    payment_method: response.payment_method,
                    discount_amount: parseFloat(response.discount_amount),
                    tax_amount: parseFloat(response.tax_amount),
                    status: response.status,
                    notes: response.notes
                }
            };

            // Store cart data for payment page
            sessionStorage.setItem('foodhub_cart_for_payment', JSON.stringify(cartData));

            // Store edit mode flag with order ID
            sessionStorage.setItem('editOrderId', dbId);
            console.log('editOrder - Stored editOrderId:', dbId, 'cartData items:', cartData.items.length);

            // Verify sessionStorage was set
            console.log('editOrder - Verified sessionStorage editOrderId:', sessionStorage.getItem('editOrderId'));
            console.log('editOrder - Verified sessionStorage cart:', sessionStorage.getItem('foodhub_cart_for_payment')?.substring(0, 100));

            // Close modal and navigate to payment page
            this.closeModal();
            window.location.href = 'payment.html';

        } catch (error) {
            console.error('Failed to load order for editing:', error);
            alert('Failed to load order for editing: ' + error.message);
        } finally {
            this.showModalLoading(false);
        }
    }

    /**
     * Update order status - show status selection modal
     */
    async updateOrderStatus() {
        const dbId = this.currentOrderDbId;
        const currentStatus = document.getElementById('modalOrderStatus').textContent.toLowerCase();

        const statusOptions = [
            { value: 'pending', label: 'Pending', class: 'badge-pending' },
            { value: 'processing', label: 'Processing', class: 'badge-processing' },
            { value: 'completed', label: 'Completed', class: 'badge-completed' }
        ];

        const selected = await this.showStatusModal(statusOptions, currentStatus);
        if (!selected || selected === currentStatus) return;

        try {
            this.showModalLoading(true);
            const response = await apiPatch(`/orders/orders/${dbId}/update_status/`, { status: selected.toUpperCase() });

            // Update the modal display
            const statusEl = document.getElementById('modalOrderStatus');
            if (statusEl) {
                statusEl.textContent = selected.toUpperCase();
                statusEl.className = 'badge-status';
                statusEl.classList.add(`badge-${selected}`);
            }

            // Refresh the orders table
            this.loadOrders();

            alert(`Order status updated to ${selected}`);
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status: ' + error.message);
        } finally {
            this.showModalLoading(false);
        }
    }

    /**
     * Show status selection modal
     */
    showStatusModal(options, currentValue) {
        return new Promise((resolve) => {
            // Remove existing status modal if any
            const existing = document.getElementById('statusModal');
            if (existing) existing.remove();

            const modalHtml = `
                <div id="statusModal" class="modal-overlay" style="display: flex;">
                    <div class="modal-container" style="max-width: 400px;">
                        <div class="modal-header">
                            <h3>Update Order Status</h3>
                            <button class="modal-close" id="statusModalClose">&times;</button>
                        </div>
                        <div class="modal-body" style="padding: 20px;">
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${options.map(opt => `
                                    <button class="status-option ${opt.value === currentValue ? 'selected' : ''}"
                                            data-value="${opt.value}"
                                            style="padding: 12px 16px; border: 2px solid ${opt.value === currentValue ? 'var(--primary)' : 'var(--border-color)'};
                                                   background: ${opt.value === currentValue ? 'var(--primary-light)' : 'white'};
                                                   border-radius: 8px; cursor: pointer; text-align: left;
                                                   display: flex; align-items: center; gap: 10px;
                                                   font-size: 14px; font-weight: 500; color: var(--slate-dark);
                                                   transition: all 0.2s;">
                                    <span class="badge-status ${opt.class}" style="font-size: 11px; padding: 2px 8px;">${opt.label}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = document.getElementById('statusModal');
            const closeBtn = document.getElementById('statusModalClose');

            const cleanup = () => {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            };

            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(null);
                }
            };
            document.addEventListener('keydown', escHandler);

            closeBtn.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(null);
                }
            });

            modal.querySelectorAll('.status-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    cleanup();
                    resolve(btn.dataset.value);
                });
                btn.addEventListener('mouseenter', () => {
                    btn.style.borderColor = 'var(--primary)';
                    btn.style.background = 'var(--primary-light)';
                });
                btn.addEventListener('mouseleave', () => {
                    if (btn.dataset.value !== currentValue) {
                        btn.style.borderColor = 'var(--border-color)';
                        btn.style.background = 'white';
                    }
                });
            });
        });
    }

    /**
     * Delete order
     */
    async deleteOrder() {
        const dbId = this.currentOrderDbId;
        const orderId = document.getElementById('modalOrderId').textContent;

        if (!confirm(`Are you sure you want to delete order ${orderId}? This action cannot be undone.`)) {
            return;
        }

        try {
            this.showModalLoading(true);
            await apiDelete(`/orders/orders/${dbId}/`);

            this.closeModal();
            this.loadOrders();

            alert('Order deleted successfully');
        } catch (error) {
            console.error('Failed to delete order:', error);
            alert('Failed to delete order: ' + error.message);
        } finally {
            this.showModalLoading(false);
        }
    }

    initEventListeners() {
        // Ensure modal exists in DOM (create dynamically if missing)
        this.ensureModalExists();

        const dateInput = document.getElementById('orderDateFilter');
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                this.currentPage = 1; // Reset to first page on date change
                this.loadOrders();
            });
        }

        const btnReset = document.getElementById('btnResetDate');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                dateInput.value = this.getTodayDateString();
                this.currentPage = 1;
                this.loadOrders();
            });
        }

        // Global view order details function
        window.viewOrderDetails = (orderId, dbId) => {
            this.viewOrderDetails(orderId, dbId);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodaysOrdersController();
});