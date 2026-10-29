import { InventoryService } from '../services/InventoryService.js';
import { C45AlgorithmService } from '../services/C45AlgorithmService.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { formatQuantity, formatQuantityWithUnit } from '../utils/format.js';

class InventoryController {

    constructor() {
        this.service = new InventoryService();

        // Backend pagination
        this.currentIngredientsUrl = '/api/inventory/ingredients/';
        this.currentPage = 1;

        this.itemsPerPage = 7;
        this.filteredIngredients = [];

        // Frontend pagination for alerts & priority (derived from same data)
        this.alertsPerPage = 3;
        this.currentAlertPage = 1;
        this.currentAlerts = [];

        this.priorityItemsPerPage = 3;
        this.currentPriorityPage = 1;
        this.currentPriorityItems = [];

        this.allIngredients = []; // For C4.5, filters, donut chart

        this.initDOM();
        this.initPagination();
        this.initAlertPagination();
        this.initPriorityPagination();
        this.initFilters();

        this.loadAllData();
    }


    // =========================================================
    // DOM REFERENCES
    // =========================================================

    initDOM() {
        // Priority list pagination
        this.priorityList = document.getElementById("priorityList");
        this.priorityPrevBtn = document.getElementById("priorityPrevBtn");
        this.priorityNextBtn = document.getElementById("priorityNextBtn");
        this.priorityPageInfo = document.getElementById("priorityPageInfo");

        this.alertPrevPageBtn = document.getElementById("alertPrevPageBtn");
        this.alertNextPageBtn = document.getElementById("alertNextPageBtn");
        this.alertPageInfo = document.getElementById("alertPageInfo");

        // Main table pagination (backend-driven)
        this.prevPageBtn = document.getElementById("prevPageBtn");
        this.nextPageBtn = document.getElementById("nextPageBtn");
        this.pageInfo = document.getElementById("pageInfo");

        // Filters
        this.statusFilter = document.getElementById("statusFilter");
        this.categoryFilter = document.getElementById("categoryFilter");
        this.searchInput = document.querySelector(".search-box input");

        // Table
        this.tableBody = document.getElementById('inventoryTableBody');

        // Summary cards
        this.totalItemsCount = document.getElementById('totalItemsCount');
        this.inStockCount = document.getElementById('inStockCount');
        this.lowStockCount = document.getElementById('lowStockCount');
        this.outStockCount = document.getElementById('outStockCount');

        // Donut chart
        this.chartTotal = document.getElementById('chartTotal');
        this.inStockPercentage = document.getElementById('inStockPercentage');
        this.lowStockPercentage = document.getElementById('lowStockPercentage');
        this.outStockPercentage = document.getElementById('outStockPercentage');
        this.inStockSegment = document.getElementById('inStockSegment');
        this.lowStockSegment = document.getElementById('lowStockSegment');
        this.outStockSegment = document.getElementById('outStockSegment');

        // Line chart (Inventory Usage)
        this.usageChartSvg = document.querySelector('.usage-chart svg');
        this.usageChartPoly = document.querySelector('.usage-chart svg polygon');
        this.usageChartLine = document.querySelector('.usage-chart svg polyline');
        this.usagePeriodSelect = document.querySelector('.analytics-select');
        this.usageXLabels = document.querySelector('.chart-x-labels');

        // Alerts
        this.alertList = document.getElementById('inventoryAlertList');
        this.alertCount = document.getElementById('alertCount');

        // C4.5
        this.highRiskCount = document.getElementById('highRiskCount');
        this.mediumRiskCount = document.getElementById('mediumRiskCount');
        this.lowRiskCount = document.getElementById('lowRiskCount');
        this.c45Recommendation = document.getElementById('c45Recommendation');

        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
        if (!this.loadingOverlay) {
            this.createLoadingOverlay();
        }

        // Modal elements
        this.modal = document.getElementById('ingredientModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalCloseBtn = document.getElementById('modalCloseBtn');
        this.modalCancelBtn = document.getElementById('modalCancelBtn');
        this.modalForm = document.getElementById('ingredientForm');
        this.modalSubmitBtn = document.getElementById('modalSubmitBtn');
        this.ingredientIdInput = document.getElementById('ingredientId');
        this.formErrorBanner = document.getElementById('formErrorBanner');
        this.btnText = this.modalSubmitBtn?.querySelector('.btn-text');
        this.btnLoader = this.modalSubmitBtn?.querySelector('.btn-loader');

        // Form fields
        this.nameInput = document.getElementById('ingredientName');
        this.categorySelect = document.getElementById('ingredientCategory');
        this.quantityInput = document.getElementById('ingredientQuantity');
        this.unitSelect = document.getElementById('ingredientUnit');
        this.reorderLevelInput = document.getElementById('ingredientReorderLevel');
        this.unitPriceInput = document.getElementById('ingredientUnitPrice');
        this.dailyUsageSelect = document.getElementById('ingredientDailyUsage');
        this.isActiveInput = document.getElementById('ingredientIsActive');
        this.descriptionInput = document.getElementById('ingredientDescription');

        // Add button
        this.addItemBtn = document.getElementById('addItemBtn');

        this.initModal();
    }

    createLoadingOverlay() {
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.id = 'loadingOverlay';
        this.loadingOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255,255,255,0.9); z-index: 9999;
            display: flex; align-items: center; justify-content: center;
            flex-direction: column; gap: 12px;
        `;
        this.loadingOverlay.innerHTML = `
            <div style="width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#0284c7;border-radius:50%;animation:spin 1s linear infinite"></div>
            <span style="color:#475569;font-weight:500">Loading inventory...</span>
            <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        `;
        document.body.appendChild(this.loadingOverlay);
    }

    // =========================================================
    // MODAL HANDLING
    // =========================================================

    initModal() {
        // Add button opens modal in "create" mode
        this.addItemBtn?.addEventListener('click', () => this.openModal('create'));

        // Close handlers
        this.modalCloseBtn?.addEventListener('click', () => this.closeModal());
        this.modalCancelBtn?.addEventListener('click', () => this.closeModal());

        // Click overlay to close
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
                this.closeModal();
            }
        });

        // Form submit
        this.modalForm?.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Edit/Delete/Adjust buttons on table (delegated)
        this.tableBody?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            if (action === 'edit') this.openModal('edit', id);
            else if (action === 'delete') this.handleDelete(id);
        });
    }

    openModal(mode, id = null) {
        this.resetForm();
        this.clearFieldErrors();

        if (mode === 'create') {
            this.modalTitle.textContent = 'Add Ingredient';
            this.btnText.textContent = 'Add Ingredient';
            this.ingredientIdInput.value = '';
            this.isActiveInput.checked = true;
        } else if (mode === 'edit') {
            this.modalTitle.textContent = 'Edit Ingredient';
            this.btnText.textContent = 'Save Changes';
            this.ingredientIdInput.value = id;
            this.populateForm(id);
        }

        this.modal?.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus first input
        setTimeout(() => this.nameInput?.focus(), 100);
    }

    closeModal() {
        this.modal?.classList.remove('active');
        document.body.style.overflow = '';
        this.resetForm();
        this.clearFieldErrors();
        this.hideFormErrorBanner();
    }

    resetForm() {
        this.modalForm?.reset();
        this.ingredientIdInput.value = '';
        this.isActiveInput.checked = true;
    }

    clearFieldErrors() {
        this.modalForm?.querySelectorAll('.field-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        this.modalForm?.querySelectorAll('.form-group').forEach(el => {
            el.classList.remove('has-error');
        });
    }

    showFieldError(fieldName, message) {
        const errorEl = this.modalForm?.querySelector(`.field-error[data-field="${fieldName}"]`);
        const groupEl = this.modalForm?.querySelector(`[name="${fieldName}"]`)?.closest('.form-group');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
        if (groupEl) groupEl.classList.add('has-error');
    }

    showFormErrorBanner(message) {
        if (this.formErrorBanner) {
            this.formErrorBanner.textContent = message;
            this.formErrorBanner.style.display = 'block';
        }
    }

    hideFormErrorBanner() {
        if (this.formErrorBanner) {
            this.formErrorBanner.style.display = 'none';
        }
    }

    setFormLoading(loading) {
        this.modalSubmitBtn.disabled = loading;
        if (this.btnText) this.btnText.style.display = loading ? 'none' : 'inline';
        if (this.btnLoader) this.btnLoader.style.display = loading ? 'inline' : 'none';
    }

    async populateForm(id) {
        try {
            this.showLoading(true);
            // Fetch single ingredient - we can get it from allIngredients cache or fetch directly
            const item = this.allIngredients.find(i => String(i.id) === String(id));
            if (!item) {
                // Fetch from API if not in cache
                const data = await this.service.getIngredients({ page: 1, page_size: 1, search: '' });
                // Actually need a different endpoint - let's just use the cached data or fetch single
                // For now, find in allIngredients
                throw new Error('Ingredient not found in cache');
            }
            this.fillFormFields(item);
        } catch (error) {
            console.error('Failed to populate form:', error);
            this.showFormErrorBanner('Failed to load ingredient data');
        } finally {
            this.showLoading(false);
        }
    }

    fillFormFields(item) {
        this.nameInput.value = item.name ?? '';
        this.categorySelect.value = item.category ?? '';
        // Format to 2 decimal places for input display (e.g., 12.00 not 12.000)
        this.quantityInput.value = item.quantity !== null && item.quantity !== undefined ? Number(item.quantity).toFixed(2) : '';
        this.unitSelect.value = item.unit ?? '';
        this.reorderLevelInput.value = item.reorder_level !== null && item.reorder_level !== undefined ? Number(item.reorder_level).toFixed(2) : '';
        this.unitPriceInput.value = item.unit_price !== null && item.unit_price !== undefined ? Number(item.unit_price).toFixed(2) : '';
        this.dailyUsageSelect.value = item.daily_usage ?? '';
        this.isActiveInput.checked = item.is_active !== false;
        this.descriptionInput.value = item.description ?? '';
    }

    getFormData() {
        return {
            name: this.nameInput.value.trim(),
            category: this.categorySelect.value,
            quantity: parseFloat(this.quantityInput.value) || 0,
            unit: this.unitSelect.value,
            reorder_level: parseFloat(this.reorderLevelInput.value) || 0,
            unit_price: parseFloat(this.unitPriceInput.value) || 0,
            daily_usage: this.dailyUsageSelect.value,
            is_active: this.isActiveInput.checked,
            description: this.descriptionInput.value.trim()
        };
    }

    validateForm(data) {
        let isValid = true;

        // Units that should only accept whole numbers (countable items)
        const countableUnits = ['pcs', 'pieces', 'piece', 'egg', 'eggs', 'tray', 'trays', 'pack', 'packs', 'box', 'boxes', 'bag', 'bags', 'sack', 'sacks', 'can', 'cans', 'bottle', 'bottles', 'jar', 'jars'];

        const isCountableUnit = countableUnits.some(u => data.unit?.toLowerCase().includes(u));

        if (!data.name) {
            this.showFieldError('name', 'Ingredient name is required');
            isValid = false;
        }

        if (!data.category) {
            this.showFieldError('category', 'Category is required');
            isValid = false;
        }

        if (data.quantity < 0) {
            this.showFieldError('quantity', 'Quantity cannot be negative');
            isValid = false;
        } else if (isCountableUnit && !Number.isInteger(data.quantity)) {
            this.showFieldError('quantity', 'Whole numbers only for countable units (pcs, pieces, eggs, trays, packs, etc.)');
            isValid = false;
        }

        if (!data.unit) {
            this.showFieldError('unit', 'Unit is required');
            isValid = false;
        }

        if (data.reorder_level < 0) {
            this.showFieldError('reorder_level', 'Reorder level cannot be negative');
            isValid = false;
        } else if (isCountableUnit && !Number.isInteger(data.reorder_level)) {
            this.showFieldError('reorder_level', 'Whole numbers only for countable units');
            isValid = false;
        }

        if (data.unit_price < 0) {
            this.showFieldError('unit_price', 'Unit price cannot be negative');
            isValid = false;
        }

        if (!data.daily_usage) {
            this.showFieldError('daily_usage', 'Daily usage is required');
            isValid = false;
        }

        return isValid;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        this.clearFieldErrors();
        this.hideFormErrorBanner();

        const formData = this.getFormData();

        // Client-side validation
        if (!this.validateForm(formData)) {
            return;
        }

        this.setFormLoading(true);
        const id = this.ingredientIdInput.value;
        const isEdit = !!id;

        try {
            if (isEdit) {
                await this.service.updateIngredient(id, formData);
            } else {
                await this.service.createIngredient(formData);
            }

            this.closeModal();
            // Targeted refresh - reload all data to update summary, table, alerts, priority, C4.5, donut
            await this.loadAllData();

        } catch (error) {
            console.error(`${isEdit ? 'Update' : 'Create'} failed:`, error);

            // Handle server-side validation errors
            if (error.response && error.response.data) {
                const serverErrors = error.response.data;
                if (typeof serverErrors === 'object' && !Array.isArray(serverErrors)) {
                    Object.entries(serverErrors).forEach(([field, messages]) => {
                        const msg = Array.isArray(messages) ? messages[0] : messages;
                        this.showFieldError(field, msg);
                    });
                    return;
                }
            }

            this.showFormErrorBanner(error.message || `${isEdit ? 'Update' : 'Create'} failed`);
        } finally {
            this.setFormLoading(false);
        }
    }

    async handleDelete(id) {
        if (!confirm('Are you sure you want to delete this ingredient? This action cannot be undone.')) {
            return;
        }

        this.showLoading(true);
        try {
            await this.service.deleteIngredient(id);
            await this.loadAllData();
        } catch (error) {
            console.error('Delete failed:', error);
            this.showError(error.message || 'Delete failed');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        // Remove existing error banner
        const existing = document.getElementById('apiErrorBanner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'apiErrorBanner';
        banner.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: #fee2e2; border: 1px solid #fecaca; color: #991b1b;
            padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            max-width: 400px; font-size: 14px;
        `;
        banner.innerHTML = `<strong>Error:</strong> ${this.escapeHTML(message)}`;
        document.body.appendChild(banner);

        setTimeout(() => banner.remove(), 8000);
    }


    // =========================================================
    // MAIN DATA LOADING
    // =========================================================

    async loadAllData() {
        this.showLoading(true);

        try {
            // Fetch all data in parallel
            const [summary, ingredients, lowStock, categories, units] = await Promise.all([
                this.service.getSummary(),
                this.service.getIngredients({ page: 1, page_size: 7 }),
                this.service.getLowStock(),
                this.service.getCategories(),
                this.service.getUnits()
            ]);

            // Store summary for donut chart & cards
            this.summaryData = summary;

            // Store all ingredients for C4.5, filters, donut chart
            // We need to fetch all pages for client-side features
            this.allIngredients = await this.fetchAllIngredients();

            // Populate filter dropdowns
            this.populateCategories(categories);
            this.populateUnits(units);

            // Render everything
            this.renderSummary(summary);
            this.renderDonutChart(summary);
            this.filteredIngredients = [...this.allIngredients];
            this.currentPage = 1;
            this.applyFiltersAndRender();
            this.renderLowStockAlerts(lowStock);
            this.renderPriorityList(this.allIngredients);
            this.renderC45Analysis(this.allIngredients);
            this.loadUsageChart(); // Load usage line chart

        } catch (error) {
            console.error('Failed to load inventory:', error);
            this.showError(error.message || 'Failed to load inventory data');
            this.renderEmptyStates();
        } finally {
            this.showLoading(false);
        }
    }


    async fetchAllIngredients() {
        const allItems = [];
        let url = '/api/inventory/ingredients/';

        while (url) {
            try {
                const fullUrl = new URL(
                    url,
                    'http://127.0.0.1:8000'
                );

                const params = Object.fromEntries(
                    fullUrl.searchParams.entries()
                );

                const data = await this.service.getIngredients(params);

                allItems.push(...(data.results ?? []));

                url = data.next;
            } catch (error) {
                console.error(
                    'Failed to fetch ingredient page:',
                    error
                );
                break;
            }
        }

        return allItems;
    }


    // =========================================================
    // SUMMARY CARDS
    // =========================================================

    renderSummary(summary) {
        if (this.totalItemsCount) this.totalItemsCount.textContent = summary.total_items ?? 0;
        if (this.inStockCount) this.inStockCount.textContent = summary.in_stock ?? 0;
        if (this.lowStockCount) this.lowStockCount.textContent = summary.low_stock ?? 0;
        if (this.outStockCount) this.outStockCount.textContent = summary.out_of_stock ?? 0;
        if (this.chartTotal) this.chartTotal.textContent = summary.total_items ?? 0;
    }

    renderEmptyStates() {
        this.renderSummary({ total_items: 0, in_stock: 0, low_stock: 0, out_of_stock: 0, total_value: 0 });
        this.renderDonutChart({ total_items: 0, in_stock: 0, low_stock: 0, out_of_stock: 0 });
        if (this.tableBody) {
            this.tableBody.innerHTML = `<tr><td colspan="8" class="empty-table">No ingredients found.</td></tr>`;
        }
        this.renderLowStockAlerts({ out_of_stock: [], low_stock: [] });
        this.renderPriorityList([]);
        this.renderC45Analysis([]);
    }


    // =========================================================
    // FILTER DROPDOWNS
    // =========================================================

    populateCategories(categories) {
        // Filter dropdown
        if (this.categoryFilter) {
            const currentValue = this.categoryFilter.value;
            this.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.value;
                opt.textContent = cat.label;
                this.categoryFilter.appendChild(opt);
            });
            this.categoryFilter.value = currentValue;
        }

        // Modal dropdown
        if (this.categorySelect) {
            const currentValue = this.categorySelect.value;
            this.categorySelect.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.value;
                opt.textContent = cat.label;
                this.categorySelect.appendChild(opt);
            });
            this.categorySelect.value = currentValue;
        }
    }

    populateUnits(units) {
        // Modal dropdown
        if (this.unitSelect) {
            const currentValue = this.unitSelect.value;
            this.unitSelect.innerHTML = '<option value="">Select Unit</option>';
            units.forEach(unit => {
                const opt = document.createElement('option');
                opt.value = unit.value;
                opt.textContent = unit.label;
                this.unitSelect.appendChild(opt);
            });
            this.unitSelect.value = currentValue;
        }
    }

    initFilters() {
        const update = () => this.applyFiltersAndRender();
        this.statusFilter?.addEventListener('change', update);
        this.categoryFilter?.addEventListener('change', update);
        this.searchInput?.addEventListener('input', update);

        // Usage chart period selector
        this.usagePeriodSelect?.addEventListener('change', () => this.loadUsageChart());
    }

    applyFiltersAndRender() {
        const status = this.statusFilter?.value || 'all';
        const category = this.categoryFilter?.value || 'all';
        const search = this.searchInput?.value?.trim().toLowerCase() || '';

        this.filteredIngredients = this.allIngredients.filter(item => {
            // Search ingredient name and description
            const matchesSearch =
                String(item.name || '').toLowerCase().includes(search) ||
                String(item.description || '').toLowerCase().includes(search);

            // Filter category
            const itemCategory = String(item.category ?? '');
            const matchesCategory =
                category === 'all' ||
                itemCategory === category;

            // Filter stock status
            const itemStatus = String(
                item.status_display || this.computeStatus(item)
            ).trim().toLowerCase().replace(/_/g, ' ');

            const statusMap = {
                instock: 'in stock',
                lowstock: 'low stock',
                outstock: 'out of stock'
            };

            const matchesStatus =
                status === 'all' ||
                itemStatus === statusMap[status];

            return matchesSearch && matchesCategory && matchesStatus;
        });

        // Always return to page 1 after changing filters
        this.currentPage = 1;
        this.renderTable(this.filteredIngredients);
    }


    async loadFilteredTable() {
        this.showLoading(true);
        try {
            const params = { page: this.currentPage, page_size: 7 };
            const status = this.statusFilter?.value;
            const category = this.categoryFilter?.value;
            const search = this.searchInput?.value?.trim().toLowerCase();

            // Backend supports: category, is_active, daily_usage, search (name, description)
            // Status filtering done client-side on returned page
            if (category && category !== 'all') params.category = category;
            if (search) params.search = search;

            const data = await this.service.getIngredients(params);

            // Client-side status filtering on returned page
            let items = data.results || [];
            if (status && status !== 'all') {
                const statusMap = { instock: 'In Stock', lowstock: 'Low Stock', outstock: 'Out of Stock' };
                const targetStatus = statusMap[status];
                items = items.filter(item => {
                    const itemStatus = item.status_display || item.status || this.computeStatus(item);
                    return itemStatus === targetStatus;
                });
                // Update data with filtered items for rendering
                data.results = items;
                data.count = items.length;
            }

            this.renderTable(data);
        } catch (error) {
            console.error('Failed to load filtered table:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }


    // =========================================================
    // INVENTORY TABLE (Backend Pagination)
    // =========================================================


    renderTable(items) {
        if (!this.tableBody) return;

        const totalItems = items.length;
        const totalPages = Math.max(
            1,
            Math.ceil(totalItems / this.itemsPerPage)
        );

        this.currentPage = Math.min(
            Math.max(1, this.currentPage),
            totalPages
        );

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;

        const visibleItems = items.slice(
            startIndex,
            startIndex + this.itemsPerPage
        );

        if (visibleItems.length === 0) {
            this.tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table">
                    No ingredients found.
                </td>
            </tr>`;
        } else {
            this.tableBody.innerHTML = visibleItems.map((item, index) => {
                const status =
                    item.status_display || this.computeStatus(item);

                const badgeClass = this.getStatusClass(status);
                const usageClass = this.getUsageClass(
                    item.daily_usage_display || item.daily_usage
                );

                const safeName = this.escapeHTML(item.name);
                const safeUnit = this.escapeHTML(
                    item.unit_display || item.unit
                );
                const safeCategory = this.escapeHTML(
                    item.category_display || item.category
                );

                return `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td><strong>${safeName}</strong></td>
                    <td>${safeCategory}</td>
                    <td>${formatQuantityWithUnit(item.quantity, safeUnit)}</td>
                    <td>${formatQuantityWithUnit(item.reorder_level, safeUnit)}</td>
                    <td>
                        <span class="badge ${usageClass}">
                            ${this.escapeHTML(
                    item.daily_usage_display || item.daily_usage
                )}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${badgeClass}">
                            ${this.escapeHTML(status)}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button
                                class="action-btn secondary btn-sm"
                                data-action="edit"
                                data-id="${this.escapeHTML(item.id)}">
                                Edit
                            </button>
                            <button
                                class="action-btn danger btn-sm"
                                data-action="delete"
                                data-id="${this.escapeHTML(item.id)}">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }

        // Update pagination information
        if (this.pageInfo) {
            this.pageInfo.textContent =
                `Page ${this.currentPage} of ${totalPages}`;
        }

        // Previous button
        if (this.prevPageBtn) {
            this.prevPageBtn.disabled = this.currentPage <= 1;

            this.prevPageBtn.onclick = () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderTable(this.filteredIngredients);
                }
            };
        }

        // Next button
        if (this.nextPageBtn) {
            this.nextPageBtn.disabled =
                this.currentPage >= totalPages;

            this.nextPageBtn.onclick = () => {
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderTable(this.filteredIngredients);
                }
            };
        }
    }

    buildUrl(data) {
        // Extract the base URL from next/previous links
        return data.next || data.previous || '/api/inventory/ingredients/';
    }


    async loadPage(url) {
        this.showLoading(true);

        try {
            const fullUrl = new URL(url, 'http://127.0.0.1:8000');
            const params = Object.fromEntries(fullUrl.searchParams.entries());

            const data = await this.service.getIngredients(params);

            // Update the current page based on the requested URL
            this.currentPage = Number(params.page) || 1;

            this.renderTable(data);
        } catch (error) {
            console.error('Failed to load page:', error);
            this.showError(error.message || 'Failed to load page');
        } finally {
            this.showLoading(false);
        }
    }


    initPagination() {
        // Handled inline in renderTable now
    }


    // =========================================================
    // LOW STOCK ALERTS (Frontend Pagination)
    // =========================================================

    renderLowStockAlerts(data) {
        if (!this.alertList) return;

        const criticalItems = [
            ...(data.out_of_stock || []),
            ...(data.low_stock || [])
        ];

        if (this.alertCount) this.alertCount.textContent = criticalItems.length;

        this.currentAlerts = criticalItems;
        this.currentAlertPage = 1;
        this.renderAlertPage();
    }

    initAlertPagination() {
        this.alertPrevPageBtn?.addEventListener("click", () => {
            if (this.currentAlertPage > 1) {
                this.currentAlertPage--;
                this.renderAlertPage();
            }
        });
        this.alertNextPageBtn?.addEventListener("click", () => {
            const totalPages = Math.max(1, Math.ceil(this.currentAlerts.length / this.alertsPerPage));
            if (this.currentAlertPage < totalPages) {
                this.currentAlertPage++;
                this.renderAlertPage();
            }
        });
    }

    renderAlertPage() {
        if (!this.alertList) return;

        const totalPages = Math.max(1, Math.ceil(this.currentAlerts.length / this.alertsPerPage));
        this.currentAlertPage = Math.min(this.currentAlertPage, totalPages);

        const startIndex = (this.currentAlertPage - 1) * this.alertsPerPage;
        const visibleAlerts = this.currentAlerts.slice(startIndex, startIndex + this.alertsPerPage);

        if (visibleAlerts.length === 0) {
            this.alertList.innerHTML = `
            <div class="alert-item healthy">
                <span class="alert-dot"></span>
                <div class="alert-content">
                    <strong>All stock levels are healthy!</strong>
                    <span>No ingredients need restocking right now.</span>
                </div>
            </div>`;
        } else {
            this.alertList.innerHTML = visibleAlerts.map(item => {
                const quantity = Number(item.quantity);

                const normalizedStatus = String(
                    item.status_display ?? item.status ?? ''
                )
                    .trim()
                    .toLowerCase()
                    .replace(/[_-]/g, ' ');

                // Quantity is the primary check
                const isOutOfStock =
                    (Number.isFinite(quantity) && quantity <= 0) ||
                    ['out of stock', 'outofstock'].includes(normalizedStatus);

                const alertClass = isOutOfStock ? 'critical' : 'warning';
                const statusText = isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK';
                const safeName = this.escapeHTML(item.name);
                const safeUnit = this.escapeHTML(item.unit_display || item.unit);
                return `
                <div class="alert-item ${alertClass}">
                    <span class="alert-dot"></span>
                    <div class="alert-content">
                        <strong>${safeName}</strong>
                        <span>Current stock: ${formatQuantityWithUnit(item.quantity, safeUnit)}</span>
                    </div>
                    <span class="alert-status">${statusText}</span>
                </div>`;
            }).join('');
        }

        if (this.alertPageInfo) this.alertPageInfo.textContent = `Page ${this.currentAlertPage} of ${totalPages}`;
        if (this.alertPrevPageBtn) this.alertPrevPageBtn.disabled = this.currentAlertPage === 1;
        if (this.alertNextPageBtn) this.alertNextPageBtn.disabled = this.currentAlertPage === totalPages;
    }


    // =========================================================
    // C4.5 ANALYSIS (Client-side - isolated for Phase 3)
    // =========================================================

    normalizeForC45(items) {
        return items.map(item => ({
            ...item,
            reorderPoint: item.reorder_level
        }));
    }

    renderC45Analysis(items) {
        const classified = C45AlgorithmService.classifyInventory(this.normalizeForC45(items));

        const highRisk = classified.filter(i => i.c45Classification === 'Out of Stock').length;
        const mediumRisk = classified.filter(i => i.c45Classification === 'Low Stock').length;
        const lowRisk = classified.filter(i => i.c45Classification === 'In Stock').length;

        if (this.highRiskCount) this.highRiskCount.textContent = highRisk;
        if (this.mediumRiskCount) this.mediumRiskCount.textContent = mediumRisk;
        if (this.lowRiskCount) this.lowRiskCount.textContent = lowRisk;

        if (this.c45Recommendation) {
            if (highRisk > 0) {
                this.c45Recommendation.textContent = `${highRisk} ingredient${highRisk > 1 ? 's' : ''} require immediate restocking based on current stock levels.`;
            } else if (mediumRisk > 0) {
                this.c45Recommendation.textContent = `${mediumRisk} ingredient${mediumRisk > 1 ? 's' : ''} require monitoring because stock is below the reorder level.`;
            } else {
                this.c45Recommendation.textContent = 'All ingredients are currently at healthy stock levels.';
            }
        }
    }


    // =========================================================
    // DONUT CHART (from summary data)
    // =========================================================

    renderDonutChart(summary) {
        const total = summary.total_items ?? 0;
        const inStock = summary.in_stock ?? 0;
        const lowStock = summary.low_stock ?? 0;
        const outStock = summary.out_of_stock ?? 0;

        let percentages;
        if (total === 0) {
            percentages = { inStock: 0, lowStock: 0, outStock: 0 };
        } else {
            // Calculate first two with rounding, last as remainder to ensure 100%
            const inStockPct = Math.round(inStock / total * 100);
            const lowStockPct = Math.round(lowStock / total * 100);
            const outStockPct = 100 - inStockPct - lowStockPct;
            percentages = { inStock: inStockPct, lowStock: lowStockPct, outStock: outStockPct };
        }

        if (this.chartTotal) this.chartTotal.textContent = total;

        const percentageElements = [
            [this.inStockPercentage, percentages.inStock],
            [this.lowStockPercentage, percentages.lowStock],
            [this.outStockPercentage, percentages.outStock]
        ];
        percentageElements.forEach(([el, val]) => { if (el) el.textContent = `${val}%`; });

        const segments = [
            [this.inStockSegment, percentages.inStock, 25],
            [this.lowStockSegment, percentages.lowStock, 25 - percentages.inStock],
            [this.outStockSegment, percentages.outStock, 25 - percentages.inStock - percentages.lowStock]
        ];
        segments.forEach(([el, pct, offset]) => {
            if (!el) return;
            el.setAttribute("stroke-dasharray", `${pct} ${100 - pct}`);
            el.setAttribute("stroke-dashoffset", String(offset));
        });
    }


    // =========================================================
    // USAGE LINE CHART (Inventory Usage)
    // =========================================================

    async loadUsageChart() {
        if (!this.usageChartSvg) return;
        const days = parseInt(this.usagePeriodSelect?.value) || 7;
        try {
            const data = await this.service.getUsageHistory(days);
            this.renderUsageChart(data);
        } catch (error) {
            console.error('Failed to load usage chart:', error);
            this.renderUsageChartFallback();
        }
    }

    renderUsageChart(data) {
        if (!this.usageChartSvg || !this.usageChartPoly || !this.usageChartLine) return;

        const { labels, values } = data;
        if (!labels?.length || !values?.length) {
            this.renderUsageChartFallback();
            return;
        }

        // Chart dimensions
        const width = 700;
        const height = 220;
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Scale values
        const maxValue = Math.max(...values, 1);
        const minValue = 0;
        const valueRange = maxValue - minValue;

        // Generate points
        const points = labels.map((_, i) => {
            const x = padding.left + (i / (labels.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - ((values[i] - minValue) / valueRange) * chartHeight;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });

        // Create polygon points (area under line)
        const polyPoints = [
            `${padding.left},${padding.top + chartHeight}`, // bottom-left
            ...points,
            `${padding.left + chartWidth},${padding.top + chartHeight}`, // bottom-right
        ].join(' ');

        // Create line points
        const linePoints = points.join(' ');

        // Update SVG
        this.usageChartPoly.setAttribute('points', polyPoints);
        this.usageChartLine.setAttribute('points', linePoints);

        // Update X-axis labels
        if (this.usageXLabels) {
            this.usageXLabels.innerHTML = labels.map(l => `<span>${l}</span>`).join('');
        }
    }

    renderUsageChartFallback() {
        // Fallback to empty chart
        if (this.usageChartPoly) this.usageChartPoly.setAttribute('points', '0,220 700,220 700,220 0,220');
        if (this.usageChartLine) this.usageChartLine.setAttribute('points', '0,220 700,220');
        if (this.usageXLabels) this.usageXLabels.innerHTML = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(l => `<span>${l}</span>`).join('');
    }


    // =========================================================
    // PRIORITY LIST (Frontend Pagination)
    // =========================================================

    renderPriorityList(items) {
        if (!this.priorityList) return;

        // Use C4.5 classification for priority
        const classified = C45AlgorithmService.classifyInventory(this.normalizeForC45(items));
        this.currentPriorityItems = classified
            .filter(item =>
                item.c45Classification === "Out of Stock" ||
                item.c45Classification === "Low Stock"
            )
            .sort((a, b) => {
                if (a.c45Classification === "Out of Stock") return -1;
                if (b.c45Classification === "Out of Stock") return 1;
                return 0;
            });
        this.currentPriorityPage = 1;
        this.renderPriorityPage();
    }

    initPriorityPagination() {
        this.priorityPrevBtn?.addEventListener("click", () => {
            if (this.currentPriorityPage > 1) {
                this.currentPriorityPage--;
                this.renderPriorityPage();
            }
        });
        this.priorityNextBtn?.addEventListener("click", () => {
            const totalPages = Math.max(1, Math.ceil(this.currentPriorityItems.length / this.priorityItemsPerPage));
            if (this.currentPriorityPage < totalPages) {
                this.currentPriorityPage++;
                this.renderPriorityPage();
            }
        });
    }

    renderPriorityPage() {
        if (!this.priorityList) return;

        const totalPages = Math.max(1, Math.ceil(this.currentPriorityItems.length / this.priorityItemsPerPage));
        this.currentPriorityPage = Math.min(this.currentPriorityPage, totalPages);

        const startIndex = (this.currentPriorityPage - 1) * this.priorityItemsPerPage;
        const visibleItems = this.currentPriorityItems.slice(startIndex, startIndex + this.priorityItemsPerPage);

        if (visibleItems.length === 0) {
            this.priorityList.innerHTML = `
            <div class="priority-item">
                <div class="priority-info">
                    <div><strong>All stock levels are healthy!</strong><span>No priority items right now.</span></div>
                </div>
            </div>`;
        } else {
            this.priorityList.innerHTML = visibleItems.map(item => {
                const isCritical = item.c45Classification === "Out of Stock";
                const type = isCritical ? "critical" : "warning";
                const label = isCritical ? "Critical" : "Low";
                const safeName = this.escapeHTML(item.name);
                const safeUnit = this.escapeHTML(item.unit);
                return `
                <div class="priority-item ${type}">
                    <div class="priority-info">
                        <div class="priority-icon">
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
                                <path d="M12 9v4"/>
                                <path d="M12 17h.01"/>
                            </svg>
                        </div>
                        <div><strong>${safeName}</strong><span>${formatQuantityWithUnit(item.quantity, safeUnit)} remaining</span></div>
                    </div>
                    <span class="priority-badge">${label}</span>
                </div>`;
            }).join('');
        }

        if (this.priorityPageInfo) this.priorityPageInfo.textContent = `Page ${this.currentPriorityPage} of ${totalPages}`;
        if (this.priorityPrevBtn) this.priorityPrevBtn.disabled = this.currentPriorityPage === 1;
        if (this.priorityNextBtn) this.priorityNextBtn.disabled = this.currentPriorityPage === totalPages;
    }


    // =========================================================
    // HELPERS
    // =========================================================

    computeStatus(item) {
        const qty = Number(item.quantity);
        const reorder = Number(item.reorder_level);
        if (qty <= 0) return 'Out of Stock';
        if (qty <= reorder) return 'Low Stock';
        return 'In Stock';
    }

    getStatusClass(status) {
        const normalizedStatus = String(status ?? '')
            .trim()
            .toUpperCase();

        if (normalizedStatus === 'IN STOCK') {
            return 'instock';
        }

        if (normalizedStatus === 'LOW STOCK') {
            return 'lowstock';
        }

        if (normalizedStatus === 'OUT OF STOCK') {
            return 'outstock';
        }

        return 'outstock';
    }

    getUsageClass(usage) {
        const map = { 'High': 'daily-usage-high', 'Medium': 'daily-usage-medium', 'Low': 'daily-usage-low' };
        return map[usage] || '';
    }

    getCategory(name) {
        const meat = ['Pork', 'Chicken', 'Beef'];
        const vegetables = ['Sili green', 'Sibuyas', 'Kalamansi'];
        const sauces = ['Toyo', 'Mayo'];
        if (meat.includes(name)) return 'Meat';
        if (vegetables.includes(name)) return 'Vegetables';
        if (sauces.includes(name)) return 'Sauces';
        return 'Others';
    }


    escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[c]);
    }

}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    loadSidebarNav();
    loadTopNavbar();
    new InventoryController();
});