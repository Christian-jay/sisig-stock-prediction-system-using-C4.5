import { PaymentService } from '../services/PaymentsService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

export class PaymentsController {
    constructor() {
        this.paymentService = new PaymentService();
        this.currentPage = 1;
        this.rowsPerPage = 10;
        this.searchTerm = '';
        this.selectedMethod = 'all';

        this.initLayout();
        this.initListeners();
        this.renderView();
    }

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();
    }

    initListeners() {
        const searchInput = document.getElementById('transactionSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.renderView();
            });
        }

        const methodSelect = document.getElementById('methodFilterSelect');
        if (methodSelect) {
            methodSelect.addEventListener('change', (e) => {
                this.selectedMethod = e.target.value;
                this.currentPage = 1;
                this.renderView();
            });
        }
    }

    renderView() {
        this.updateStats();
        this.renderTable();
    }

    updateStats() {
        const metrics = this.paymentService.getPaymentMetrics();

        document.getElementById('statCashCount').textContent = metrics.cash.count;
        document.getElementById('statCashAmount').textContent = `₱${metrics.cash.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        document.getElementById('statGcashCount').textContent = metrics.gcash.count;
        document.getElementById('statGcashAmount').textContent = `₱${metrics.gcash.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        document.getElementById('statMayaCount').textContent = metrics.maya.count;
        document.getElementById('statMayaAmount').textContent = `₱${metrics.maya.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        document.getElementById('statPandaCount').textContent = metrics.panda.count;
        document.getElementById('statPandaAmount').textContent = `₱${metrics.panda.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    renderTable() {
        const tbody = document.getElementById('paymentsTableBody');
        const paginationInfo = document.getElementById('paymentsPaginationInfo');
        const paginationButtons = document.getElementById('paymentsPaginationButtons');
        if (!tbody) return;

        const allPayments = this.paymentService.getPayments();

        // Filter transactions (Search by Order ID & Method)
        const filtered = allPayments.filter(t => {
            const matchesSearch = t.id.toLowerCase().includes(this.searchTerm);
            const matchesMethod = this.selectedMethod === 'all' || t.method.toLowerCase() === this.selectedMethod.toLowerCase();
            return matchesSearch && matchesMethod;
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

                return `
                    <tr>
                        <td>${t.date}</td>
                        <td><strong>${t.id}</strong></td>
                        <td>
                            <span class="method-badge ${badgeClass}">
                                ${t.method}
                            </span>
                        </td>
                        <td><strong>₱${t.amount.toFixed(2)}</strong></td>
                        <td>
                            <span class="status-paid-badge">
                                Paid
                            </span>
                        </td>
                        <td class="text-right">
                            <button class="btn-view-details" onclick="alert('Viewing details for ${t.id}')">View Details</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Pagination buttons rendering logic
        if (paginationButtons) {
            let buttonsHtml = `<button class="btn-page" ${this.currentPage === 1 ? 'disabled' : ''} id="prevPageBtn">Prev</button>`;
            for (let i = 1; i <= totalPages; i++) {
                buttonsHtml += `<button class="btn-page ${i === this.currentPage ? 'active-page' : ''}" data-page="${i}">${i}</button>`;
            }
            buttonsHtml += `<button class="btn-page" ${this.currentPage === totalPages ? 'disabled' : ''} id="nextPageBtn">Next</button>`;
            paginationButtons.innerHTML = buttonsHtml;

            paginationButtons.querySelectorAll('[data-page]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentPage = parseInt(btn.dataset.page);
                    this.renderTable();
                });
            });

            const prevBtn = document.getElementById('prevPageBtn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.renderTable();
                    }
                });
            }

            const nextBtn = document.getElementById('nextPageBtn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < totalPages) {
                        this.currentPage++;
                        this.renderTable();
                    }
                });
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PaymentsController();
});