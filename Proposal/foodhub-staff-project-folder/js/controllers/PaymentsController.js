import { PaymentService } from '../services/PaymentsService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { apiGet } from '../utils/api.js';

export class PaymentsController {
    constructor() {
        this.paymentService = new PaymentService();
        this.currentPage = 1;
        this.rowsPerPage = 10;
        this.searchTerm = '';
        this.selectedMethod = 'all';
        this.selectedStatus = 'all';
        this.dateFrom = '';
        this.dateTo = '';
        this.dateFilterActive = false;  // Track if user has explicitly set date filter

        this.initLayout();
        this.initListeners();
        this.setDefaultDateInputs();  // Set input values to today and activate filter for today
        this.renderView();
    }

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();
    }

    setDefaultDateInputs() {
        // Use Manila timezone (Asia/Manila) for default date to match backend order number generation
        // toISOString() returns UTC, which can be off by one day in early morning Manila time
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
        // Set input values to today AND activate filter to show only today's transactions by default
        const dateFromInput = document.getElementById('dateFromFilter');
        const dateToInput = document.getElementById('dateToFilter');
        if (dateFromInput) dateFromInput.value = today;
        if (dateToInput) dateToInput.value = today;
        this.dateFrom = today;
        this.dateTo = today;
        this.dateFilterActive = true;
    }

    initListeners() {
        // Search input
        const searchInput = document.getElementById('transactionSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.renderView();
            });
        }

        // Method filter
        const methodSelect = document.getElementById('methodFilterSelect');
        if (methodSelect) {
            methodSelect.addEventListener('change', (e) => {
                this.selectedMethod = e.target.value;
                this.currentPage = 1;
                this.renderView();
            });
        }

        // Status filter
        const statusSelect = document.getElementById('statusFilterSelect');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                this.selectedStatus = e.target.value;
                this.currentPage = 1;
                this.renderView();
            });
        }

        // Date from filter - auto-apply when changed
        const dateFromInput = document.getElementById('dateFromFilter');
        if (dateFromInput) {
            dateFromInput.addEventListener('change', (e) => {
                this.dateFrom = e.target.value;
                this.dateFilterActive = true;
                this.currentPage = 1;
                this.renderView();
            });
        }

        // Date to filter - auto-apply when changed
        const dateToInput = document.getElementById('dateToFilter');
        if (dateToInput) {
            dateToInput.addEventListener('change', (e) => {
                this.dateTo = e.target.value;
                this.dateFilterActive = true;
                this.currentPage = 1;
                this.renderView();
            });
        }

        // Apply date filter button (kept for explicit apply if needed)
        const applyBtn = document.getElementById('btnApplyDateFilter');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.dateFilterActive = true;
                this.currentPage = 1;
                this.renderView();
            });
        }

        // Today button - filter to today's transactions
        const resetBtn = document.getElementById('btnResetDate');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                this.dateFrom = today;
                this.dateTo = today;
                this.dateFilterActive = true;
                this.setDefaultDateInputs();
                this.currentPage = 1;
                this.renderView();
            });
        }

        // Modal close buttons
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        const modalCloseBtn2 = document.getElementById('modalCloseBtn2');
        const modalOverlay = document.getElementById('paymentDetailsModal');

        const closeModal = () => {
            if (modalOverlay) modalOverlay.style.display = 'none';
        };

        modalCloseBtn?.addEventListener('click', closeModal);
        modalCloseBtn2?.addEventListener('click', closeModal);
        modalOverlay?.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay?.style.display === 'flex') {
                closeModal();
            }
        });
    }

    async renderView() {
        await this.updateStats();
        await this.renderTable();
    }

    async updateStats() {
        try {
            const allPayments = await this.paymentService.getPayments();

            // Apply the same filters used by the payments table
            const filteredPayments = allPayments.filter(payment => {
                const matchesSearch = payment.id
                    .toLowerCase()
                    .includes(this.searchTerm);

                const matchesMethod =
                    this.selectedMethod === 'all' ||
                    payment.method.toLowerCase() ===
                    this.selectedMethod.toLowerCase();

                const matchesStatus =
                    this.selectedStatus === 'all' ||
                    payment.status === this.selectedStatus;

                let matchesDate = true;

                if (this.dateFilterActive && (this.dateFrom || this.dateTo)) {
                    const paymentDate = this.parsePaymentDate(payment);

                    if (this.dateFrom && paymentDate < this.dateFrom) {
                        matchesDate = false;
                    }

                    if (this.dateTo && paymentDate > this.dateTo) {
                        matchesDate = false;
                    }
                }

                return (
                    matchesSearch &&
                    matchesMethod &&
                    matchesStatus &&
                    matchesDate
                );
            });

            // Calculate count and amount using only filtered payments
            const getSummaryByMethod = methodName => {
                const payments = filteredPayments.filter(
                    payment =>
                        payment.method.toLowerCase() ===
                        methodName.toLowerCase()
                );

                return {
                    count: payments.length,
                    totalAmount: payments.reduce(
                        (sum, payment) => sum + payment.amount,
                        0
                    )
                };
            };

            const metrics = {
                cash: getSummaryByMethod('Cash'),
                gcash: getSummaryByMethod('GCash'),
                maya: getSummaryByMethod('Maya'),
                panda: getSummaryByMethod('Panda')
            };

            document.getElementById('statCashCount').textContent =
                metrics.cash.count;

            document.getElementById('statCashAmount').textContent =
                `₱${metrics.cash.totalAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;

            document.getElementById('statGcashCount').textContent =
                metrics.gcash.count;

            document.getElementById('statGcashAmount').textContent =
                `₱${metrics.gcash.totalAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;

            document.getElementById('statMayaCount').textContent =
                metrics.maya.count;

            document.getElementById('statMayaAmount').textContent =
                `₱${metrics.maya.totalAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;

            document.getElementById('statPandaCount').textContent =
                metrics.panda.count;

            document.getElementById('statPandaAmount').textContent =
                `₱${metrics.panda.totalAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;
        } catch (error) {
            console.error('Failed to update payment stats:', error);
        }
    }

    async renderTable() {
        const tbody = document.getElementById('paymentsTableBody');
        const paginationInfo = document.getElementById('paymentsPaginationInfo');
        const paginationButtons = document.getElementById('paymentsPaginationButtons');
        if (!tbody) return;

        try {
            const allPayments = await this.paymentService.getPayments();

            // Filter transactions (Search, Method, Status, Date)
            const filtered = allPayments.filter(t => {
                const matchesSearch = t.id.toLowerCase().includes(this.searchTerm);
                const matchesMethod = this.selectedMethod === 'all' || t.method.toLowerCase() === this.selectedMethod.toLowerCase();
                const matchesStatus = this.selectedStatus === 'all' || t.status === this.selectedStatus;

                // Date filter - only apply when user has explicitly set a date filter
                let matchesDate = true;
                if (this.dateFilterActive && (this.dateFrom || this.dateTo)) {
                    const paymentDate = this.parsePaymentDate(t);
                    if (this.dateFrom && paymentDate < this.dateFrom) matchesDate = false;
                    if (this.dateTo && paymentDate > this.dateTo) matchesDate = false;
                }

                return matchesSearch && matchesMethod && matchesStatus && matchesDate;
            });

            const totalPages = Math.ceil(filtered.length / this.rowsPerPage) || 1;
            if (this.currentPage > totalPages) this.currentPage = totalPages;

            const start = (this.currentPage - 1) * this.rowsPerPage;
            const end = Math.min(start + this.rowsPerPage, filtered.length);
            const paginated = filtered.slice(start, end);

            if (paginationInfo) {
                paginationInfo.textContent = filtered.length > 0
                    ? `Showing ${start + 1}-${end} of ${filtered.length} payments`
                    : 'Showing 0 of 0 payments';
            }

            if (paginated.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--slate-muted);">No payment transactions found.</td></tr>`;
            } else {
                tbody.innerHTML = paginated.map(t => {
                    let badgeClass = 'method-cash';
                    const lowerMethod = t.method.toLowerCase();

                    if (lowerMethod === 'gcash') {
                        badgeClass = 'method-gcash';
                    } else if (lowerMethod === 'maya') {
                        badgeClass = 'method-maya';
                    } else if (lowerMethod === 'panda') {
                        badgeClass = 'method-panda';
                    }

                    // Status badge based on actual payment status (PAID/UNPAID)
                    const isPaid = t.status === 'PAID';
                    const statusBadgeClass = isPaid ? 'status-paid-badge' : 'status-unpaid-badge';
                    const statusText = isPaid ? 'Paid' : 'Unpaid';

                    return `
                        <tr data-order-id="${t.id}">
                            <td>${t.date}</td>
                            <td><strong>${t.id}</strong></td>
                            <td>
                                <span class="method-badge ${badgeClass}">
                                    ${t.method}
                                </span>
                            </td>
                            <td><strong>₱${t.amount.toFixed(2)}</strong></td>
                            <td>
                                <span class="${statusBadgeClass}">
                                    ${statusText}
                                </span>
                            </td>
                            <td class="text-right">
                                <button class="btn-view-details" data-db-id="${t.dbId}" data-order-id="${t.id}">View Details</button>
                            </td>
                        </tr>
                    `;
                }).join('');

                // Add click handlers for View Details buttons
                tbody.querySelectorAll('.btn-view-details').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const dbId = e.target.dataset.dbId;
                        const orderId = e.target.dataset.orderId;
                        this.showPaymentDetails(dbId, orderId, allPayments);
                    });
                });
            }

            // Pagination buttons rendering logic
            if (paginationButtons) {
                const pageWindow = 2;
                const pages = new Set([1, totalPages]);

                // Show pages around the current page
                for (
                    let page = Math.max(1, this.currentPage - pageWindow);
                    page <= Math.min(totalPages, this.currentPage + pageWindow);
                    page++
                ) {
                    pages.add(page);
                }

                const sortedPages = [...pages].sort((a, b) => a - b);
                let buttonsHtml = `
        <button
            class="btn-page"
            id="prevPageBtn"
            ${this.currentPage === 1 ? 'disabled' : ''}
        >Prev</button>
    `;

                let previousPage = 0;

                sortedPages.forEach(page => {
                    if (previousPage && page - previousPage > 1) {
                        buttonsHtml += `
                <span class="pagination-ellipsis">...</span>
            `;
                    }

                    buttonsHtml += `
            <button
                class="btn-page ${page === this.currentPage ? 'active-page' : ''}"
                data-page="${page}"
                ${page === this.currentPage ? 'aria-current="page"' : ''}
            >${page}</button>
        `;

                    previousPage = page;
                });

                buttonsHtml += `
        <button
            class="btn-page"
            id="nextPageBtn"
            ${this.currentPage === totalPages ? 'disabled' : ''}
        >Next</button>
    `;

                paginationButtons.innerHTML = buttonsHtml;

                paginationButtons.querySelectorAll('[data-page]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.currentPage = Number(btn.dataset.page);
                        this.renderTable();
                    });
                });

                document.getElementById('prevPageBtn')?.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.renderTable();
                    }
                });

                document.getElementById('nextPageBtn')?.addEventListener('click', () => {
                    if (this.currentPage < totalPages) {
                        this.currentPage++;
                        this.renderTable();
                    }
                });
            }
        } catch (error) {
            console.error('Failed to render payments table:', error);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--red-600);">Failed to load payments. Please try again.</td></tr>`;
        }
    }

    parsePaymentDate(payment) {
        // Use the original ISO date (createdAt) for reliable date comparison in Manila timezone
        if (payment.createdAt) {
            const date = new Date(payment.createdAt);
            return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
        }
        // Fallback: parse the formatted date string
        try {
            const date = new Date(payment.date);
            return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
        } catch {
            return '';
        }
    }

    async showPaymentDetails(dbId, orderId, allPayments) {
        const payment = allPayments.find(p => p.id === orderId);
        if (!payment) return;

        const modalItemsContainer = document.getElementById('modalItemsContainer');
        const modalSubtotal = document.getElementById('modalSubtotal');
        const modalTax = document.getElementById('modalTax');
        const modalDiscountRow = document.getElementById('modalDiscountRow');
        const modalDiscount = document.getElementById('modalDiscount');
        const modalTotal = document.getElementById('modalTotal');

        // Show loading state
        modalItemsContainer.innerHTML = '<p style="color: var(--slate-muted); font-size: 14px; text-align: center; padding: 20px;">Loading order details...</p>';
        this.openModal();

        // Fetch full order details from API for complete info (using detail endpoint with database ID)
        try {
            const order = await apiGet(`/orders/orders/${dbId}/`);
            this.populateModal(order);
        } catch (detailError) {
            console.error('Detail endpoint failed, trying search:', detailError);

            // Fallback: try search endpoint with order_number
            try {
                const data = await apiGet(`/orders/orders/?search=${encodeURIComponent(orderId)}`);
                const order = data.results?.[0] || data[0];
                if (order) {
                    this.populateModal(order);
                    return;
                }
                throw new Error('Order not found in search results');
            } catch (searchError) {
                console.error('Search endpoint also failed:', searchError);

                // Show error in modal instead of silent fallback
                modalItemsContainer.innerHTML = `
                    <div style="color: var(--red-600); text-align: center; padding: 20px;">
                        <p>Failed to load order details.</p>
                        <p style="font-size: 12px; margin-top: 8px;">${searchError.message || detailError.message}</p>
                        <button class="btn-secondary" onclick="window.paymentsControllerInstance?.showPaymentDetails('${dbId}', '${orderId}', ${JSON.stringify(allPayments).replace(/"/g, '"')})" style="margin-top: 12px; padding: 8px 16px; font-size: 12px;">Retry</button>
                    </div>
                `;
            }
        }
    }

    populateModalFromPayment(payment) {
        document.getElementById('modalOrderId').textContent = payment.id;
        document.getElementById('modalDateTime').textContent = payment.date;
        document.getElementById('modalMethod').textContent = payment.method;
        document.getElementById('modalMethod').className = `badge-status ${this.getMethodBadgeClass(payment.method)}`;

        // Status with proper badge (PAID/UNPAID only)
        const isPaid = payment.status === 'PAID';
        document.getElementById('modalStatus').textContent = isPaid ? 'Paid' : 'Unpaid';
        document.getElementById('modalStatus').className = `badge-status ${isPaid ? 'badge-completed' : 'badge-pending'}`;

        // Items not available from payment list, show placeholder
        document.getElementById('modalItemsContainer').innerHTML = '<p style="color: var(--slate-muted); font-size: 14px;">Item details not available in payment list. Full order details require API access.</p>';

        document.getElementById('modalSubtotal').textContent = `₱${(payment.amount / 1.12).toFixed(2)}`;
        document.getElementById('modalTax').textContent = `₱${(payment.amount * 0.12 / 1.12).toFixed(2)}`;
        document.getElementById('modalDiscountRow').style.display = 'none';
        document.getElementById('modalTotal').textContent = `₱${payment.amount.toFixed(2)}`;

        this.openModal();
    }

    populateModal(order) {
        document.getElementById('modalOrderId').textContent = order.order_number;

        // Format date in Manila timezone to match backend order number generation
        const createdAt = new Date(order.created_at);
        document.getElementById('modalDateTime').textContent = createdAt.toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const methodMap = { 'CASH': 'Cash', 'GCASH': 'GCash', 'MAYA': 'Maya', 'FOODPANDA': 'Panda' };
        const method = methodMap[order.payment_method] || 'Cash';
        document.getElementById('modalMethod').textContent = method;
        document.getElementById('modalMethod').className = `badge-status ${this.getMethodBadgeClass(method)}`;

        // Status with proper badge (PAID/UNPAID only)
        const isPaid = order.payment_status === 'PAID';
        document.getElementById('modalStatus').textContent = isPaid ? 'Paid' : 'Unpaid';
        document.getElementById('modalStatus').className = `badge-status ${isPaid ? 'badge-completed' : 'badge-pending'}`;

        // Items
        const items = order.items || [];
        const itemsHtml = items.map(item => `
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-name">${item.menu_item_name}</div>
                    <div class="order-item-details">Qty: ${item.quantity} × ₱${parseFloat(item.unit_price).toFixed(2)}</div>
                </div>
                <div class="order-item-total">₱${parseFloat(item.line_total).toFixed(2)}</div>
            </div>
        `).join('');
        document.getElementById('modalItemsContainer').innerHTML = itemsHtml || '<p style="color: var(--slate-muted);">No items</p>';

        // Totals
        const subtotal = parseFloat(order.subtotal) || 0;
        const tax = parseFloat(order.tax_amount) || 0;
        const discount = parseFloat(order.discount_amount) || 0;
        const total = parseFloat(order.total_amount) || 0;

        document.getElementById('modalSubtotal').textContent = `₱${subtotal.toFixed(2)}`;
        document.getElementById('modalTax').textContent = `₱${tax.toFixed(2)}`;

        const discountRow = document.getElementById('modalDiscountRow');
        if (discount > 0) {
            discountRow.style.display = 'flex';
            document.getElementById('modalDiscount').textContent = `-₱${discount.toFixed(2)}`;
        } else {
            discountRow.style.display = 'none';
        }

        document.getElementById('modalTotal').textContent = `₱${total.toFixed(2)}`;

        this.openModal();
    }

    getMethodBadgeClass(method) {
        const lower = method.toLowerCase();
        if (lower === 'gcash') return 'method-gcash';
        if (lower === 'maya') return 'method-maya';
        if (lower === 'panda') return 'method-panda';
        return 'method-cash';
    }

    openModal() {
        const modal = document.getElementById('paymentDetailsModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.paymentsControllerInstance = new PaymentsController();
});