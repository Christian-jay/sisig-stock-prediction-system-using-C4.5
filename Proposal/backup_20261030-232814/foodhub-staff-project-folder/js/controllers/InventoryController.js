import { InventoryService } from '../services/InventoryService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

export class InventoryController {

    constructor() {
        this.inventoryService = new InventoryService();

        // Main inventory table
        this.currentStockPage = 1;
        this.stockRowsPerPage = 10;

        // Low-stock table
        this.currentLowPage = 1;
        this.lowRowsPerPage = 10;

        // Modal elements
        this.addIngredientModal = null;
        this.addIngredientForm = null;
        this.dropdownsLoaded = false;

        this.initLayout();
        this.initModal();
        this.registerGlobalActions();
        this.loadInventoryView();
    }

    /* =========================================================
       LAYOUT
       ========================================================= */

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();
    }

    /* =========================================================
       MODAL INITIALIZATION
       ========================================================= */

    initModal() {
        this.addIngredientModal = document.getElementById('addIngredientModal');
        this.addIngredientForm = document.getElementById('addIngredientForm');

        if (!this.addIngredientModal || !this.addIngredientForm) return;

        // Close button
        const closeBtn = document.getElementById('addIngredientModalCloseBtn');
        const cancelBtn = document.getElementById('addIngredientCancelBtn');

        const closeModal = () => this.closeAddIngredientModal();

        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);

        // Close on overlay click
        this.addIngredientModal.addEventListener('click', (e) => {
            if (e.target === this.addIngredientModal) closeModal();
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.addIngredientModal?.style.display === 'flex') {
                closeModal();
            }
        });

        // Form submission
        this.addIngredientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddIngredientSubmit();
        });

        // Add Ingredient button
        const addBtn = document.getElementById('btnAddIngredient');
        addBtn?.addEventListener('click', () => this.openAddIngredientModal());
    }

    async openAddIngredientModal() {
        if (!this.addIngredientModal) return;

        // Load dropdown options if not already loaded
        if (!this.dropdownsLoaded) {
            await this.loadDropdownOptions();
            this.dropdownsLoaded = true;
        }

        // Reset form
        this.addIngredientForm.reset();

        // Show modal
        this.addIngredientModal.style.display = 'flex';

        // Focus first input
        setTimeout(() => {
            const firstInput = this.addIngredientForm.querySelector('input, select');
            firstInput?.focus();
        }, 100);
    }

    closeAddIngredientModal() {
        if (this.addIngredientModal) {
            this.addIngredientModal.style.display = 'none';
        }
    }

    async loadDropdownOptions() {
        try {
            const [categories, units, dailyUsageLevels] = await Promise.all([
                this.inventoryService.getCategories(),
                this.inventoryService.getUnits(),
                this.inventoryService.getDailyUsageLevels()
            ]);

            // Populate category dropdown
            const categorySelect = document.getElementById('addIngredientCategory');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Select Category</option>' +
                    categories.map(c => `<option value="${c.value}">${c.label}</option>`).join('');
            }

            // Populate unit dropdown
            const unitSelect = document.getElementById('addIngredientUnit');
            if (unitSelect) {
                unitSelect.innerHTML = '<option value="">Select Unit</option>' +
                    units.map(u => `<option value="${u.value}">${u.label}</option>`).join('');
            }

            // Populate daily usage dropdown
            const usageSelect = document.getElementById('addIngredientDailyUsage');
            if (usageSelect) {
                usageSelect.innerHTML = '<option value="">Select Usage</option>' +
                    dailyUsageLevels.map(d => `<option value="${d.value}">${d.label}</option>`).join('');
            }
        } catch (error) {
            console.error('Failed to load dropdown options:', error);
        }
    }

    async handleAddIngredientSubmit() {
        const submitBtn = document.getElementById('addIngredientSubmitBtn');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoading = submitBtn?.querySelector('.btn-loading');

        if (!submitBtn) return;

        // Get form data
        const formData = new FormData(this.addIngredientForm);
        const data = {
            name: formData.get('name'),
            category: formData.get('category'),
            quantity: parseFloat(formData.get('quantity')) || 0,
            unit: formData.get('unit'),
            reorder_level: parseFloat(formData.get('reorder_level')) || 0,
            unit_price: parseFloat(formData.get('unit_price')) || 0,
            daily_usage: formData.get('daily_usage'),
            description: formData.get('description') || '',
            is_active: true
        };

        // Validate required fields
        if (!data.name || !data.category || !data.unit || !data.daily_usage) {
            alert('Please fill in all required fields.');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline-flex';

        try {
            const newIngredient = await this.inventoryService.createIngredient(data);
            this.closeAddIngredientModal();
            await this.loadInventoryView();
        } catch (error) {
            console.error('Failed to add ingredient:', error);
            const errorMessage = error.message || 'Failed to add ingredient. Please try again.';
            alert(errorMessage);
        } finally {
            submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    /* =========================================================
       LOAD INVENTORY
       ========================================================= */

    async loadInventoryView() {
        try {
            // Show loading state
            this.showLoadingState();

            const data = await this.inventoryService.getDashboardData();

            this.updateStats(data);
            this.renderStockTable(data.ingredients);
            this.renderLowStockTable(data.lowStockIngredients);

            // Load C4.5 mock data (keep local for now)
            this.loadC45MockData();
        } catch (error) {
            console.error('Failed to load inventory view:', error);
            this.showErrorState('Failed to load inventory data. Please try again.');
        }
    }

    showLoadingState() {
        const stockTbody = document.getElementById('ingredientStockTableBody');
        const lowTbody = document.getElementById('lowStockTableBody');

        if (stockTbody) {
            stockTbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table">
                        <div style="display:flex;align-items:center;justify-content:center;gap:10px;">
                            <div class="spinner" style="width:20px;height:20px;border:2px solid var(--border-color);border-top-color:var(--primary);border-radius:50%;animation:spin 1s linear infinite;"></div>
                            Loading inventory...
                        </div>
                    </td>
                </tr>
            `;
        }
        if (lowTbody) {
            lowTbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table">
                        <div style="display:flex;align-items:center;justify-content:center;gap:10px;">
                            <div class="spinner" style="width:20px;height:20px;border:2px solid var(--border-color);border-top-color:var(--primary);border-radius:50%;animation:spin 1s linear infinite;"></div>
                            Loading low stock...
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    showErrorState(message) {
        const stockTbody = document.getElementById('ingredientStockTableBody');
        const lowTbody = document.getElementById('lowStockTableBody');

        if (stockTbody) {
            stockTbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table" style="color:var(--danger-text);">
                        ${message}
                        <button class="btn-primary-sm" onclick="window.inventoryControllerInstance?.loadInventoryView()" style="margin-left:10px;">Retry</button>
                    </td>
                </tr>
            `;
        }
        if (lowTbody) {
            lowTbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table" style="color:var(--danger-text);">
                        ${message}
                    </td>
                </tr>
            `;
        }
    }


    /* =========================================================
       C4.5 MOCK DATA (Local - for thesis analysis section)
       ========================================================= */

    loadC45MockData() {
        const tbody = document.getElementById(
            'c45PredictionTableBody'
        );

        const runBtn = document.getElementById(
            'runC45AnalysisBtn'
        );

        if (!tbody) return;

        const analyzeInventory = () => {
            // Use the current ingredients from service
            this.inventoryService.getIngredients().then(ingredients => {

                const escape = value =>
                    this.escapeHtml(value);

                const assessments = ingredients.map(item => {
                    const quantity = Number(item.quantity) || 0;
                    const reorderLevel =
                        Number(item.reorderLevel) || 0;

                    const usage = String(
                        item.dailyUsage || 'Low'
                    ).toLowerCase();

                    let risk;
                    let reason;
                    let action;
                    let priority;

                    if (quantity <= 0) {
                        risk = 'Critical';
                        reason = 'No stock available';
                        action = 'Restock immediately';
                        priority = 4;
                    } else if (quantity <= reorderLevel) {
                        risk = 'High';
                        reason = 'Stock has reached the reorder level';
                        action = 'Prepare a replenishment request';
                        priority = 3;
                    } else if (
                        usage === 'high' &&
                        quantity <= reorderLevel * 2
                    ) {
                        risk = 'High';
                        reason = 'High daily usage with limited stock buffer';
                        action = 'Review stock and prioritize replenishment';
                        priority = 3;
                    } else if (
                        usage === 'high' ||
                        (
                            usage === 'medium' &&
                            quantity <= reorderLevel * 2
                        )
                    ) {
                        risk = 'Medium';
                        reason = 'Usage pattern warrants closer monitoring';
                        action = 'Monitor stock and review usage';
                        priority = 2;
                    } else {
                        risk = 'Low';
                        reason = 'Stock is above the reorder threshold';
                        action = 'Continue routine monitoring';
                        priority = 1;
                    }

                    return {
                        ...item,
                        risk,
                        reason,
                        action,
                        priority
                    };
                });

                // Most urgent items appear first.
                assessments.sort((a, b) =>
                    b.priority - a.priority ||
                    a.name.localeCompare(b.name)
                );

                const criticalCount = assessments.filter(
                    item => item.quantity <= 0
                ).length;

                const riskCount = assessments.filter(
                    item =>
                        item.quantity > 0 &&
                        item.risk === 'High'
                ).length;

                const criticalEl = document.getElementById(
                    'c45CriticalCount'
                );

                const riskEl = document.getElementById(
                    'c45RiskCount'
                );

                const monitoredEl = document.getElementById(
                    'c45MonitoredCount'
                );

                if (criticalEl) {
                    criticalEl.textContent = criticalCount;
                }

                if (riskEl) {
                    riskEl.textContent = riskCount;
                }

                if (monitoredEl) {
                    monitoredEl.textContent = assessments.length;
                }

                const banner = document.getElementById(
                    'c45AlertBanner'
                );

                const title = document.getElementById(
                    'c45AlertTitle'
                );

                const description = document.getElementById(
                    'c45AlertDescription'
                );

                if (banner && title && description) {
                    banner.classList.remove(
                        'is-critical',
                        'is-warning'
                    );

                    if (criticalCount > 0) {
                        banner.classList.add('is-critical');
                        title.textContent =
                            `${criticalCount} ingredient(s) are out of stock`;

                        description.textContent =
                            'Staff should prioritize restocking these items. ' +
                            'Administrators should review replenishment needs.';
                    } else if (riskCount > 0) {
                        banner.classList.add('is-warning');
                        title.textContent =
                            `${riskCount} ingredient(s) require attention`;

                        description.textContent =
                            'Review the high-risk items and prepare replenishment ' +
                            'before shortages occur.';
                    } else {
                        title.textContent =
                            'No critical stock alerts';

                        description.textContent =
                            'No ingredients are currently classified as critical ' +
                            'or high risk by these inventory rules.';
                    }
                }

                if (assessments.length === 0) {
                    tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-table">
                            No ingredients available for analysis.
                        </td>
                    </tr>
                `;
                } else {
                    tbody.innerHTML = assessments.map(item => {
                        const riskClass = {
                            Critical: 'critical',
                            High: 'high',
                            Medium: 'medium',
                            Low: 'low'
                        }[item.risk];

                        return `
                        <tr>
                            <td>
                                <strong>${escape(item.name)}</strong>
                                <small style="display:block;color:#64748b;margin-top:4px">
                                    ${escape(item.category)}
                                </small>
                            </td>
                            <td>
                                ${this.formatNumber(item.quantity)}
                                ${escape(item.unit)}
                            </td>
                            <td>
                                ${this.formatNumber(item.reorderLevel)}
                                ${escape(item.unit)}
                            </td>
                            <td>${escape(item.dailyUsage)}</td>
                            <td>
                                <span class="c45-risk ${riskClass}">
                                    ${item.risk}
                                </span>
                                <small style="display:block;color:#64748b;margin-top:5px;white-space:normal">
                                    ${escape(item.reason)}
                                </small>
                            </td>
                            <td>
                                <span class="c45-action-text">
                                    ${escape(item.action)}
                                </span>
                            </td>
                        </tr>
                    `;
                    }).join('');
                }

                const status = document.getElementById(
                    'c45StatusText'
                );

                if (status) {
                    status.textContent =
                        `Analysis complete · ${assessments.length} ingredients evaluated`;
                }
            });
        };

        analyzeInventory();

        if (runBtn) {
            runBtn.onclick = analyzeInventory;
        }
    }

    /* =========================================================
       UPDATE STAT CARDS
       ========================================================= */

    updateStats(data) {
        const totalIngredients =
            document.getElementById('statTotalIngredients');

        const inStock =
            document.getElementById('statInStock');

        const lowStock =
            document.getElementById('statLowStock');

        const outOfStock =
            document.getElementById('statOutOfStock');

        const totalValue =
            document.getElementById('statTotalValue');

        if (totalIngredients) {
            totalIngredients.textContent = data.totalIngredients;
        }

        if (inStock) {
            inStock.textContent = data.inStockCount;
        }

        if (lowStock) {
            lowStock.textContent = data.lowStockCount;
        }

        if (outOfStock) {
            outOfStock.textContent = data.outOfStockCount;
        }

        if (totalValue) {
            totalValue.textContent =
                `₱${Number(data.totalStockValue).toLocaleString(
                    'en-US',
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                )}`;
        }
    }

    /* =========================================================
       MAIN INVENTORY TABLE
       ========================================================= */

    renderStockTable(ingredients) {

        const tbody =
            document.getElementById('ingredientStockTableBody');

        const paginationInfo =
            document.getElementById('stockPaginationInfo');

        const prevButton =
            document.getElementById('prevStockBtn');

        const nextButton =
            document.getElementById('nextStockBtn');

        if (!tbody) return;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    ingredients.length /
                    this.stockRowsPerPage
                )
            );

        /*
         * Prevent invalid page after deleting an item.
         */

        if (this.currentStockPage > totalPages) {
            this.currentStockPage = totalPages;
        }

        if (this.currentStockPage < 1) {
            this.currentStockPage = 1;
        }

        const start =
            (this.currentStockPage - 1) *
            this.stockRowsPerPage;

        const end =
            Math.min(
                start + this.stockRowsPerPage,
                ingredients.length
            );

        const paginatedItems =
            ingredients.slice(start, end);

        /* =====================================================
           PAGINATION TEXT
           ===================================================== */

        if (paginationInfo) {
            paginationInfo.textContent =
                ingredients.length > 0
                    ? `Showing ${start + 1}-${end} of ${ingredients.length}`
                    : 'Showing 0 of 0';
        }

        /* =====================================================
           EMPTY STATE
           ===================================================== */

        if (paginatedItems.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table">
                        No ingredients found.
                    </td>
                </tr>
            `;

        } else {

            tbody.innerHTML =
                paginatedItems
                    .map((item, index) => {

                        const absoluteIndex =
                            start + index + 1;

                        const statusClass =
                            this.getStatusClass(item.status);

                        const usageClass =
                            this.getUsageClass(item.dailyUsage);

                        return `
                            <tr>

                                <!-- # -->
                                <td>
                                    ${absoluteIndex}
                                </td>

                                <!-- Ingredient -->
                                <td>
                                    <strong>
                                        ${this.escapeHtml(item.name)}
                                    </strong>
                                </td>

                                <!-- Category -->
                                <td>
                                    ${this.escapeHtml(item.category)}
                                </td>

                                <!-- Current Stock -->
                                <td>
                                    <span
                                        id="qty-text-${item.id}"
                                    >
                                        ${this.formatNumber(item.quantity)}
                                        ${this.escapeHtml(item.unit)}
                                    </span>

                                    <input
                                        type="number"
                                        id="qty-input-${item.id}"
                                        class="edit-input"
                                        value="${item.quantity}"
                                        min="0"
                                        step="0.01"
                                        style="display: none;"
                                    >
                                </td>

                                <!-- Reorder Level -->
                                <td>
                                    ${this.formatNumber(item.reorderLevel)}
                                    ${this.escapeHtml(item.unit)}
                                </td>

                                <!-- Daily Usage -->
                                <td>
                                    <span
                                        class="badge ${usageClass}"
                                    >
                                        ${this.escapeHtml(item.dailyUsage)}
                                    </span>
                                </td>

                                <!-- Status -->
                                <td>
                                    <span
                                        class="badge ${statusClass}"
                                    >
                                        ${this.escapeHtml(item.status)}
                                    </span>
                                </td>

                                <!-- Action -->
                                <td class="action-cell">

                                    <div class="action-buttons">

                                        <button
                                            id="edit-btn-${item.id}"
                                            class="btn-edit-action"
                                            data-action="edit"
                                            data-id="${item.id}"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            id="save-btn-${item.id}"
                                            class="btn-save-action"
                                            data-action="save"
                                            data-id="${item.id}"
                                            style="display: none;"
                                        >
                                            Save
                                        </button>

                                        <button
                                            class="btn-delete-action"
                                            data-action="delete"
                                            data-id="${item.id}"
                                        >
                                            Delete
                                        </button>

                                    </div>

                                </td>

                            </tr>
                        `;
                    })
                    .join('');
        }

        /* =====================================================
           PAGINATION BUTTONS
           ===================================================== */

        if (prevButton) {

            prevButton.disabled =
                this.currentStockPage <= 1;

            prevButton.onclick = () => {

                if (this.currentStockPage > 1) {

                    this.currentStockPage--;

                    this.renderStockTable(
                        this.inventoryService.getIngredients()
                    );
                }
            };
        }

        if (nextButton) {

            nextButton.disabled =
                this.currentStockPage >= totalPages;

            nextButton.onclick = () => {

                if (
                    this.currentStockPage <
                    totalPages
                ) {

                    this.currentStockPage++;

                    this.renderStockTable(
                        this.inventoryService.getIngredients()
                    );
                }
            };
        }
    }

    /* =========================================================
       LOW STOCK TABLE
       ========================================================= */

    renderLowStockTable(lowStockItems) {

        const tbody =
            document.getElementById('lowStockTableBody');

        const paginationInfo =
            document.getElementById('lowStockPaginationInfo');

        const prevButton =
            document.getElementById('prevLowBtn');

        const nextButton =
            document.getElementById('nextLowBtn');

        if (!tbody) return;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    lowStockItems.length /
                    this.lowRowsPerPage
                )
            );

        if (this.currentLowPage > totalPages) {
            this.currentLowPage = totalPages;
        }

        if (this.currentLowPage < 1) {
            this.currentLowPage = 1;
        }

        const start =
            (this.currentLowPage - 1) *
            this.lowRowsPerPage;

        const end =
            Math.min(
                start + this.lowRowsPerPage,
                lowStockItems.length
            );

        const paginatedItems =
            lowStockItems.slice(start, end);

        if (paginationInfo) {

            paginationInfo.textContent =
                lowStockItems.length > 0
                    ? `Showing ${start + 1}-${end} of ${lowStockItems.length}`
                    : 'Showing 0 of 0';
        }

        if (paginatedItems.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table">
                        No low stock alerts.
                    </td>
                </tr>
            `;

        } else {

            tbody.innerHTML =
                paginatedItems
                    .map((item, index) => {

                        const absoluteIndex =
                            start + index + 1;

                        const statusClass =
                            this.getStatusClass(item.status);

                        const usageClass =
                            this.getUsageClass(item.dailyUsage);

                        return `
                            <tr>

                                <td>
                                    ${absoluteIndex}
                                </td>

                                <td>
                                    <strong>
                                        ${this.escapeHtml(item.name)}
                                    </strong>
                                </td>

                                <td>
                                    ${this.escapeHtml(item.category)}
                                </td>

                                <td>
                                    ${this.formatNumber(item.quantity)}
                                    ${this.escapeHtml(item.unit)}
                                </td>

                                <td>
                                    ${this.formatNumber(item.reorderLevel)}
                                    ${this.escapeHtml(item.unit)}
                                </td>

                                <td>
                                    <span
                                        class="badge ${usageClass}"
                                    >
                                        ${this.escapeHtml(item.dailyUsage)}
                                    </span>
                                </td>

                                <td>
                                    <span
                                        class="badge ${statusClass}"
                                    >
                                        ${this.escapeHtml(item.status)}
                                    </span>
                                </td>

                                <td class="action-cell">
                                    <span
                                        class="badge badge-secondary"
                                    >
                                        Monitor
                                    </span>
                                </td>

                            </tr>
                        `;
                    })
                    .join('');
        }

        /* =====================================================
           LOW STOCK PAGINATION
           ===================================================== */

        if (prevButton) {

            prevButton.disabled =
                this.currentLowPage <= 1;

            prevButton.onclick = () => {

                if (this.currentLowPage > 1) {

                    this.currentLowPage--;

                    this.inventoryService.getDashboardData()
                        .then(data => {
                            this.renderLowStockTable(
                                data.lowStockIngredients
                            );
                        });
                }
            };
        }

        if (nextButton) {

            nextButton.disabled =
                this.currentLowPage >= totalPages;

            nextButton.onclick = () => {

                if (
                    this.currentLowPage <
                    totalPages
                ) {

                    this.currentLowPage++;

                    this.inventoryService.getDashboardData()
                        .then(data => {
                            this.renderLowStockTable(
                                data.lowStockIngredients
                            );
                        });
                }
            };
        }
    }

    /* =========================================================
       GLOBAL ACTION HANDLERS
       ========================================================= */

    registerGlobalActions() {

        document.addEventListener('click', (event) => {

            const button =
                event.target.closest('[data-action]');

            if (!button) return;

            const action =
                button.dataset.action;

            const id =
                button.dataset.id;

            if (!id) return;

            if (action === 'edit') {
                this.toggleEdit(id);
            }

            if (action === 'save') {
                this.saveEdit(id);
            }

            if (action === 'delete') {
                this.deleteIngredient(id);
            }
        });
    }

    /* =========================================================
       EDIT
       ========================================================= */

    toggleEdit(id) {

        const text =
            document.getElementById(
                `qty-text-${id}`
            );

        const input =
            document.getElementById(
                `qty-input-${id}`
            );

        const editButton =
            document.getElementById(
                `edit-btn-${id}`
            );

        const saveButton =
            document.getElementById(
                `save-btn-${id}`
            );

        if (
            !text ||
            !input ||
            !editButton ||
            !saveButton
        ) {
            return;
        }

        text.style.display = 'none';

        input.style.display = 'inline-block';

        editButton.style.display = 'none';

        saveButton.style.display = 'inline-block';

        input.focus();

        input.select();
    }

    /* =========================================================
       SAVE
       ========================================================= */

    async saveEdit(id) {

        const input =
            document.getElementById(
                `qty-input-${id}`
            );

        if (!input) return;

        const newQuantity =
            parseFloat(input.value);

        if (
            Number.isNaN(newQuantity) ||
            newQuantity < 0
        ) {

            alert(
                'Please enter a valid quantity.'
            );

            return;
        }

        // Disable save button during save
        const saveButton = document.getElementById(`save-btn-${id}`);
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;

        const success =
            await this.inventoryService.updateIngredient(
                id,
                newQuantity
            );

        saveButton.textContent = originalText;
        saveButton.disabled = false;

        if (!success) {

            alert(
                'Unable to update the ingredient. Please check your connection and try again.'
            );

            return;
        }

        // Reload the view to get fresh data from API
        await this.loadInventoryView();
    }

    /* =========================================================
       DELETE
       ========================================================= */

    async deleteIngredient(id) {

        const ingredients =
            await this.inventoryService.getIngredients();

        const ingredient =
            ingredients.find(
                item => item.id === id
            );

        if (!ingredient) return;

        const confirmed =
            confirm(
                `Are you sure you want to delete "${ingredient.name}"?`
            );

        if (!confirmed) return;

        // Disable delete button during delete
        const deleteButtons = document.querySelectorAll(`[data-action="delete"][data-id="${id}"]`);
        deleteButtons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';
        });

        const success =
            await this.inventoryService.deleteIngredient(id);

        deleteButtons.forEach(btn => {
            btn.disabled = false;
            btn.textContent = 'Delete';
        });

        if (!success) {

            alert(
                'Unable to delete the ingredient. Please check your connection and try again.'
            );

            return;
        }

        /*
         * Reload from page 1 after deletion.
         */

        this.currentStockPage = 1;
        this.currentLowPage = 1;

        await this.loadInventoryView();
    }

    /* =========================================================
       STATUS HELPERS
       ========================================================= */

    getStatusClass(status) {

        switch (status) {

            case 'In Stock':
                return 'badge-success';

            case 'Low Stock':
                return 'badge-warning';

            case 'Out of Stock':
                return 'badge-danger';

            default:
                return 'badge-secondary';
        }
    }

    getUsageClass(usage) {

        switch (
        String(usage).toLowerCase()
        ) {

            case 'high':
                return 'daily-usage-high';

            case 'medium':
                return 'daily-usage-medium';

            case 'low':
                return 'daily-usage-low';

            default:
                return 'badge-secondary';
        }
    }

    /* =========================================================
       NUMBER FORMAT
       ========================================================= */

    formatNumber(value) {

        const number =
            Number(value);

        if (Number.isNaN(number)) {
            return '0';
        }

        return Number.isInteger(number)
            ? number.toString()
            : number.toFixed(2);
    }

    /* =========================================================
       BASIC HTML ESCAPE
       ========================================================= */

    escapeHtml(value) {

        return String(value ?? '')
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#039;');
    }
}

/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {
        window.inventoryControllerInstance = new InventoryController();
    }
);