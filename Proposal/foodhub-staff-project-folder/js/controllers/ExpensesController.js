import { ExpensesService } from '../services/ExpensesService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

/**
 * Category label to value mapping for API calls
 * Backend expects uppercase values: SUPPLIES, UTILITIES, OTHERS, INGREDIENTS
 */
const CATEGORY_LABEL_TO_VALUE = {
    'Supplies': 'SUPPLIES',
    'Utilities': 'UTILITIES',
    'Others': 'OTHERS',
    'Ingredients': 'INGREDIENTS'
};

export class ExpensesController {
    constructor() {
        this.expensesService = new ExpensesService();

        // Pagination State
        this.expensePage = 1;
        this.expenseRowsPerPage = 10;

        // Filter State (removed date filters)
        this.currentFilters = {
            search: '',
            category: 'All'
        };

        // Category mapping for dropdown (label -> value)
        this.categoryMap = {}; // label -> value

        // Track if event listeners are already bound
        this.listenersBound = false;

        // Track current expense being viewed/edited
        this.currentExpense = null;
        this.isEditMode = false;

        this.initLayout();
        this.loadExpensesView();
    }

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();
    }

    async loadExpensesView() {
        this.showLoadingState();

        try {
            // Fetch summary stats and expense records in parallel
            const [summaryData, expensesResponse, categories] = await Promise.allSettled([
                this.expensesService.getExpensesSummary(),
                this.expensesService.getExpensesData({
                    page: this.expensePage,
                    page_size: this.expenseRowsPerPage,
                    ...this.currentFilters
                }),
                this.expensesService.getCategories()
            ]);

            // Handle summary data
            const summary = summaryData.status === 'fulfilled' ? summaryData.value : this.getDefaultSummary();

            // Handle expenses data
            const expenses = expensesResponse.status === 'fulfilled' ? expensesResponse.value : { results: [], count: 0 };

            // Update category filter dropdown with dynamic categories (returns {value, label} objects)
            this.updateCategoryFilter(categories.status === 'fulfilled' ? categories.value : []);

            // Update Stat Cards
            this.updateStatCards(summary);

            // Render Expenses Table
            this.renderExpenseTable(expenses.results, expenses.count);

            // Bind Event Listeners (only once)
            if (!this.listenersBound) {
                this.initEventListeners();
                this.listenersBound = true;
            }

        } catch (error) {
            console.error('[ExpensesController] Error loading expenses:', error);
            this.showErrorState(error.message);
        }
    }

    getDefaultSummary() {
        return {
            totalExpenses: 0,
            totalTransactions: 0,
            highestCategoryName: 'N/A',
            highestCategoryAmount: 0,
            averageExpense: 0
        };
    }

    showLoadingState() {
        // Show skeleton loaders for stat cards
        const statCards = document.querySelectorAll('.stat-card .stat-value');
        statCards.forEach(card => {
            card.innerHTML = '<div class="skeleton-loader stat-skeleton"></div>';
        });

        // Show loading in table
        const tbody = document.getElementById('expenseRecordsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center" style="padding: 40px;">
                    <div class="spinner"></div>
                    <p class="text-muted" style="margin-top: 12px;">Loading expenses...</p>
                </td>
            </tr>
        `;
    }

    showErrorState(message) {
        // Update stat cards with error state
        const statCards = document.querySelectorAll('.stat-card .stat-value');
        statCards.forEach(card => {
            card.textContent = 'Error';
            card.classList.add('text-danger');
        });

        // Show error in table
        const tbody = document.getElementById('expenseRecordsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger" style="padding: 40px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.6;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>Failed to load expenses</p>
                    <p class="text-muted font-13">${message}</p>
                    <button class="btn-retry" onclick="window.location.reload()">Retry</button>
                </td>
            </tr>
        `;
    }

    updateStatCards(summary) {
        document.getElementById('statTotalExpenses').textContent = `₱${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        document.getElementById('statTotalTransactions').textContent = summary.totalTransactions;
        document.getElementById('statHighestCategory').textContent = summary.highestCategoryName;
        document.getElementById('statHighestCategoryAmount').textContent = `₱${summary.highestCategoryAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        document.getElementById('statAverageExpense').textContent = `₱${summary.averageExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    updateCategoryFilter(categories) {
        const select = document.getElementById('categoryFilterSelect');
        const currentValue = select.value;

        // Build category map: label -> value
        this.categoryMap = {};
        categories.forEach(cat => {
            this.categoryMap[cat.label] = cat.value;
        });

        // Rebuild options using labels for display, values for API
        select.innerHTML = '<option value="All">All Categories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.label; // Store label in option value for UI
            option.textContent = cat.label;
            select.appendChild(option);
        });

        // Restore selected value if it exists
        if (categories.some(c => c.label === currentValue) || currentValue === 'All') {
            select.value = currentValue;
        } else {
            select.value = 'All';
            this.currentFilters.category = 'All';
        }
    }

    renderExpenseTable(records, totalCount) {
        const tbody = document.getElementById('expenseRecordsTableBody');
        const totalPages = Math.ceil(totalCount / this.expenseRowsPerPage) || 1;

        if (this.expensePage > totalPages) this.expensePage = totalPages;
        if (this.expensePage < 1) this.expensePage = 1;

        const start = (this.expensePage - 1) * this.expenseRowsPerPage;

        document.getElementById('expensePaginationInfo').textContent =
            `Showing ${totalCount ? start + 1 : 0}-${Math.min(start + this.expenseRowsPerPage, totalCount)} of ${totalCount} records`;

        if (records.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted" style="padding: 40px;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.4;">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></line>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        <p>No expense records found.</p>
                        <p class="font-13">Try adjusting your filters or add a new expense.</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = records.map(item => {
                let badgeClass = 'badge-supplies';
                const catLower = item.category.toLowerCase();
                if (catLower === 'utilities') badgeClass = 'badge-utilities';
                else if (catLower === 'others') badgeClass = 'badge-others';
                else if (catLower === 'ingredients') badgeClass = 'badge-ingredients';

                return `
                    <tr>
                        <td><span class="text-muted font-13">${item.getFormattedDateTime()}</span></td>
                        <td><strong>${this.escapeHtml(item.description)}</strong></td>
                        <td><span class="badge ${badgeClass}">${item.category}</span></td>
                        <td><strong>₱${parseFloat(item.amount).toFixed(2)}</strong></td>
                        <td>
                            <div class="action-btn-group">
                                <button class="btn-action-view" onclick="window.viewExpenseDetails(${item.id})" title="View Details">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Update pagination buttons
        const prevBtn = document.getElementById('prevExpenseBtn');
        const nextBtn = document.getElementById('nextExpenseBtn');

        prevBtn.disabled = this.expensePage <= 1;
        nextBtn.disabled = this.expensePage >= totalPages;

        prevBtn.onclick = () => {
            if (this.expensePage > 1) {
                this.expensePage--;
                this.loadExpensesView();
            }
        };
        nextBtn.onclick = () => {
            if (this.expensePage < totalPages) {
                this.expensePage++;
                this.loadExpensesView();
            }
        };
    }

    initEventListeners() {
        const searchInput = document.getElementById('searchExpenseInput');
        const categoryFilter = document.getElementById('categoryFilterSelect');
        const addExpenseBtn = document.querySelector('.btn-add-primary');

        // Debounced search
        let searchDebounceTimer;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    this.currentFilters.search = e.target.value.toLowerCase();
                    this.expensePage = 1;
                    this.loadExpensesView();
                }, 300);
            });
        }

        // Category filter - convert label to value for API
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                const selectedLabel = e.target.value;
                this.currentFilters.category = selectedLabel;
                this.expensePage = 1;
                this.loadExpensesView();
            });
        }

        // Add Expense button
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.openAddExpenseModal());
        }

        // Global view expense details handler
        window.viewExpenseDetails = (id) => this.openViewExpenseModal(id);

        // Close modals on overlay click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }
        });
    }

    openAddExpenseModal() {
        // Build categories from categoryMap or use defaults
        const categories = Object.keys(this.categoryMap).length > 0
            ? Object.keys(this.categoryMap)
            : ['Supplies', 'Utilities', 'Others', 'Ingredients'];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Add Expense</h3>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <form id="addExpenseForm" class="modal-body">
                    <div class="form-group">
                        <label for="expenseDescription">Description <span class="required">*</span></label>
                        <input type="text" id="expenseDescription" name="description" required placeholder="e.g., Rice (5kg)">
                    </div>
                    <div class="form-group">
                        <label for="expenseCategory">Category <span class="required">*</span></label>
                        <select id="expenseCategory" name="category" required>
                            <option value="">Select category</option>
                            ${categories.map(cat => `<option value="${CATEGORY_LABEL_TO_VALUE[cat] || cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="expenseAmount">Amount (₱) <span class="required">*</span></label>
                        <input type="number" id="expenseAmount" name="amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label for="expenseDate">Date <span class="required">*</span></label>
                        <input type="date" id="expenseDate" name="date" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" id="cancelAddExpense">Cancel</button>
                        <button type="submit" class="btn-primary">Add Expense</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus first input
        setTimeout(() => modal.querySelector('#expenseDescription').focus(), 100);

        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeAllModals());
        modal.querySelector('#cancelAddExpense').addEventListener('click', () => this.closeAllModals());
        modal.querySelector('#addExpenseForm').addEventListener('submit', (e) => this.handleAddExpense(e, modal));
    }

    async handleAddExpense(e, modal) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const expenseData = {
            description: formData.get('description').trim(),
            category: formData.get('category'), // This is now the value (uppercase)
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date')
        };

        // Validation
        if (!expenseData.description || !expenseData.category || isNaN(expenseData.amount) || !expenseData.date) {
            alert('Please fill in all required fields.');
            return;
        }

        const submitBtn = modal.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';

        try {
            await this.expensesService.createExpense(expenseData);
            this.closeAllModals();
            this.expensePage = 1; // Reset to first page to show new expense
            await this.loadExpensesView();
            this.showToast('Expense added successfully!', 'success');
        } catch (error) {
            console.error('[ExpensesController] Error adding expense:', error);
            this.showToast(`Failed to add expense: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Expense';
        }
    }

    async openViewExpenseModal(id) {
        // Show loading modal first
        const loadingModal = document.createElement('div');
        loadingModal.className = 'modal-overlay';
        loadingModal.innerHTML = `
            <div class="modal" style="max-width: 450px;">
                <div class="modal-header">
                    <h3>Expense Details</h3>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="text-center" style="padding: 40px;">
                        <div class="spinner"></div>
                        <p class="text-muted" style="margin-top: 12px;">Loading expense details...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(loadingModal);
        loadingModal.querySelector('.modal-close').addEventListener('click', () => this.closeAllModals());

        try {
            const expense = await this.expensesService.getExpense(id);
            this.currentExpense = expense;
            this.isEditMode = false;

            // Replace loading modal with detail modal
            this.closeAllModals();
            this.showExpenseDetailModal(expense);
        } catch (error) {
            console.error('[ExpensesController] Error viewing expense:', error);
            this.closeAllModals();
            this.showToast('Failed to load expense details: ' + error.message, 'error');
        }
    }

    showExpenseDetailModal(expense) {
        const formatDateTime = (dateStr) => {
            if (!dateStr) return 'N/A';
            try {
                const d = new Date(dateStr);
                return d.toLocaleString('en-US', {
                    timeZone: 'Asia/Manila',
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            } catch (e) {
                return dateStr;
            }
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            try {
                const d = new Date(dateStr);
                return d.toLocaleDateString('en-US', {
                    timeZone: 'Asia/Manila',
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric'
                });
            } catch (e) {
                return dateStr;
            }
        };

        const formatDateInput = (dateStr) => {
            if (!dateStr) return '';
            try {
                const d = new Date(dateStr);
                return d.toISOString().split('T')[0];
            } catch (e) {
                return '';
            }
        };

        // Build categories for edit dropdown
        const categories = Object.keys(this.categoryMap).length > 0
            ? Object.keys(this.categoryMap)
            : ['Supplies', 'Utilities', 'Others', 'Ingredients'];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 450px;">
                <div class="modal-header">
                    <h3>${this.isEditMode ? 'Edit Expense' : 'Expense Details'}</h3>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    ${this.isEditMode ? this.renderEditForm(expense, categories, formatDateInput) : this.renderDetailView(expense, formatDateTime, formatDate)}
                </div>
                <div class="modal-footer">
                    ${this.isEditMode
                        ? `<button type="button" class="btn-secondary" id="cancelEdit">Cancel</button>
                           <button type="button" class="btn-primary" id="saveEdit">Save Changes</button>`
                        : `<button type="button" class="btn-secondary" id="editExpense">Edit</button>
                           <button type="button" class="btn-danger" id="deleteExpense">Delete</button>
                           <button type="button" class="btn-primary" id="closeViewExpense">Close</button>`
                    }
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeAllModals());

        if (this.isEditMode) {
            modal.querySelector('#cancelEdit').addEventListener('click', () => this.cancelEdit());
            modal.querySelector('#saveEdit').addEventListener('click', () => this.saveEdit(modal));
            // Focus first input
            setTimeout(() => modal.querySelector('#editDescription').focus(), 100);
        } else {
            modal.querySelector('#editExpense').addEventListener('click', () => this.enterEditMode());
            modal.querySelector('#deleteExpense').addEventListener('click', () => this.confirmDelete());
            modal.querySelector('#closeViewExpense').addEventListener('click', () => this.closeAllModals());
        }
    }

    renderDetailView(expense, formatDateTime, formatDate) {
        return `
            <div class="expense-detail-grid">
                <div class="detail-row">
                    <span class="detail-label">Expense ID</span>
                    <span class="detail-value">${expense.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Description</span>
                    <span class="detail-value">${this.escapeHtml(expense.description)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category</span>
                    <span class="detail-value"><span class="badge badge-${expense.category.toLowerCase()}">${expense.category}</span></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount</span>
                    <span class="detail-value"><strong>₱${parseFloat(expense.amount).toFixed(2)}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Expense Date</span>
                    <span class="detail-value">${formatDate(expense.timestamp)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Created</span>
                    <span class="detail-value">${formatDateTime(expense.createdAt)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Last Updated</span>
                    <span class="detail-value">${formatDateTime(expense.updatedAt)}</span>
                </div>
            </div>
        `;
    }

    renderEditForm(expense, categories, formatDateInput) {
        return `
            <form id="editExpenseForm">
                <div class="form-group">
                    <label for="editDescription">Description <span class="required">*</span></label>
                    <input type="text" id="editDescription" name="description" required value="${this.escapeHtml(expense.description)}">
                </div>
                <div class="form-group">
                    <label for="editCategory">Category <span class="required">*</span></label>
                    <select id="editCategory" name="category" required>
                        <option value="">Select category</option>
                        ${categories.map(cat => `<option value="${CATEGORY_LABEL_TO_VALUE[cat] || cat}" ${expense.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="editAmount">Amount (₱) <span class="required">*</span></label>
                    <input type="number" id="editAmount" name="amount" required min="0.01" step="0.01" value="${parseFloat(expense.amount).toFixed(2)}">
                </div>
                <div class="form-group">
                    <label for="editDate">Date <span class="required">*</span></label>
                    <input type="date" id="editDate" name="date" required value="${formatDateInput(expense.timestamp)}">
                </div>
            </form>
        `;
    }

    enterEditMode() {
        this.isEditMode = true;
        this.showExpenseDetailModal(this.currentExpense);
    }

    cancelEdit() {
        this.isEditMode = false;
        this.showExpenseDetailModal(this.currentExpense);
    }

    async saveEdit(modal) {
        const form = modal.querySelector('#editExpenseForm');
        const formData = new FormData(form);

        const expenseData = {
            description: formData.get('description').trim(),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date')
        };

        // Validation
        if (!expenseData.description || !expenseData.category || isNaN(expenseData.amount) || !expenseData.date) {
            this.showToast('Please fill in all required fields.', 'error');
            return;
        }

        if (expenseData.amount <= 0) {
            this.showToast('Amount must be greater than zero.', 'error');
            return;
        }

        const saveBtn = modal.querySelector('#saveEdit');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const updatedExpense = await this.expensesService.updateExpense(this.currentExpense.id, expenseData);
            this.currentExpense = updatedExpense;
            this.isEditMode = false;
            this.showExpenseDetailModal(updatedExpense);
            await this.loadExpensesView(); // Refresh table and summary
            this.showToast('Expense updated successfully!', 'success');
        } catch (error) {
            console.error('[ExpensesController] Error updating expense:', error);
            this.showToast(`Failed to update expense: ${error.message}`, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    }

    confirmDelete() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 450px;">
                <div class="modal-header">
                    <h3>Confirm Delete</h3>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this expense?</p>
                    <div class="expense-detail-grid" style="margin-top: 16px; padding: 16px; background: var(--bg-main); border-radius: 8px;">
                        <div class="detail-row" style="padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
                            <span class="detail-label">Description</span>
                            <span class="detail-value">${this.escapeHtml(this.currentExpense.description)}</span>
                        </div>
                        <div class="detail-row" style="padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
                            <span class="detail-label">Category</span>
                            <span class="detail-value"><span class="badge badge-${this.currentExpense.category.toLowerCase()}">${this.currentExpense.category}</span></span>
                        </div>
                        <div class="detail-row" style="padding-bottom: 0; border-bottom: none;">
                            <span class="detail-label">Amount</span>
                            <span class="detail-value"><strong>₱${parseFloat(this.currentExpense.amount).toFixed(2)}</strong></span>
                        </div>
                    </div>
                    <p class="text-muted font-13" style="margin-top: 12px;">This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelDelete">Cancel</button>
                    <button type="button" class="btn-danger" id="confirmDeleteBtn">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancelDelete').addEventListener('click', () => modal.remove());
        modal.querySelector('#confirmDeleteBtn').addEventListener('click', () => this.deleteExpense(modal));
    }

    async deleteExpense(confirmModal) {
        const deleteBtn = confirmModal.querySelector('#confirmDeleteBtn');
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Deleting...';

        try {
            await this.expensesService.deleteExpense(this.currentExpense.id);
            this.closeAllModals();

            // Adjust page if we deleted the last item on the current page
            // The loadExpensesView will handle pagination correctly
            await this.loadExpensesView();
            this.showToast('Expense deleted successfully!', 'success');
        } catch (error) {
            console.error('[ExpensesController] Error deleting expense:', error);
            this.showToast(`Failed to delete expense: ${error.message}`, 'error');
        } finally {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.remove());
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${this.escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => toast.classList.add('show'));

        // Auto dismiss
        const dismissTimer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);

        // Manual dismiss
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(dismissTimer);
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ExpensesController();
});