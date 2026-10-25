import { ExpensesService } from '../services/ExpensesService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

export class ExpensesController {
    constructor() {
        this.expensesService = new ExpensesService();

        // Pagination State para sa Expenses nalang
        this.expensePage = 1;
        this.expenseRowsPerPage = 5;

        this.initLayout();
        this.loadExpensesView();
    }

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();
    }

    loadExpensesView() {
        const data = this.expensesService.getExpensesData();

        // Update Stat Cards
        document.getElementById('statTotalExpenses').textContent = `₱${data.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        document.getElementById('statTotalTransactions').textContent = data.totalTransactions;
        document.getElementById('statHighestCategory').textContent = data.highestCategoryName;
        document.getElementById('statHighestCategoryAmount').textContent = `₱${data.highestCategoryAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        document.getElementById('statAverageExpense').textContent = `₱${data.averageExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        // Render Expenses Table
        this.renderExpenseTable(data.expenseRecords);

        // Bind Search & Category Filters
        this.initEventListeners(data);
    }

    renderExpenseTable(records) {
        const tbody = document.getElementById('expenseRecordsTableBody');
        const totalPages = Math.ceil(records.length / this.expenseRowsPerPage) || 1;

        if (this.expensePage > totalPages) this.expensePage = totalPages;
        if (this.expensePage < 1) this.expensePage = 1;

        const start = (this.expensePage - 1) * this.expenseRowsPerPage;
        const paginatedRecords = records.slice(start, start + this.expenseRowsPerPage);

        document.getElementById('expensePaginationInfo').textContent =
            `Showing ${records.length ? start + 1 : 0}-${Math.min(start + this.expenseRowsPerPage, records.length)} of ${records.length} records`;

        if (paginatedRecords.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:20px;">No expense records found.</td></tr>`;
        } else {
            tbody.innerHTML = paginatedRecords.map(item => {
                let badgeClass = 'badge-supplies';
                const catLower = item.category.toLowerCase();
                if (catLower === 'utilities') badgeClass = 'badge-utilities';
                if (catLower === 'others') badgeClass = 'badge-others';

                return `
                    <tr>
                        <td><span class="text-muted font-13">${item.getFormattedDateTime()}</span></td>
                        <td><strong>${item.description}</strong></td>
                        <td><span class="badge ${badgeClass}">${item.category}</span></td>
                        <td><strong>₱${parseFloat(item.amount).toFixed(2)}</strong></td>
                        <td>
                            <div class="action-btn-group">
                                <button class="btn-action-view" onclick="window.viewExpenseDetails('${item.id}')">View</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Pagination handlers
        document.getElementById('prevExpenseBtn').onclick = () => {
            if (this.expensePage > 1) {
                this.expensePage--;
                this.renderExpenseTable(records);
            }
        };
        document.getElementById('nextExpenseBtn').onclick = () => {
            if (this.expensePage < totalPages) {
                this.expensePage++;
                this.renderExpenseTable(records);
            }
        };
    }

    initEventListeners(data) {
        const searchInput = document.getElementById('searchExpenseInput');
        const categoryFilter = document.getElementById('categoryFilterSelect');

        const filterFn = () => {
            const query = searchInput.value.toLowerCase();
            const selectedCat = categoryFilter.value;

            const filtered = data.expenseRecords.filter(item => {
                const matchesSearch = item.description.toLowerCase().includes(query);
                const matchesCategory = selectedCat === 'All' || item.category === selectedCat;
                return matchesSearch && matchesCategory;
            });

            this.expensePage = 1;
            this.renderExpenseTable(filtered);
        };

        if (searchInput) searchInput.addEventListener('input', filterFn);
        if (categoryFilter) categoryFilter.addEventListener('change', filterFn);

        window.viewExpenseDetails = (id) => {
            alert(`Viewing Details for Expense Record ID: ${id}`);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ExpensesController();
});