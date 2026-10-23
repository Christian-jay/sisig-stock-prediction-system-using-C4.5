import { InventoryService } from '../services/InventoryService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

export class InventoryController {

    constructor() {
        this.inventoryService = new InventoryService();

        // Main inventory table
        this.currentStockPage = 1;
        this.stockRowsPerPage = 5;

        // Low-stock table
        this.currentLowPage = 1;
        this.lowRowsPerPage = 5;

        this.initLayout();
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
       LOAD INVENTORY
       ========================================================= */

    loadInventoryView() {
        const data = this.inventoryService.getDashboardData();

        this.updateStats(data);
        this.renderStockTable(data.ingredients);
        this.renderLowStockTable(data.lowStockIngredients);

        // I-load ang mock data para sa C4.5 section
        this.loadC45MockData();
    }


    loadC45MockData() {
        const tbody = document.getElementById(
            'c45PredictionTableBody'
        );

        const runBtn = document.getElementById(
            'runC45AnalysisBtn'
        );

        if (!tbody) return;

        const analyzeInventory = () => {
            const ingredients =
                this.inventoryService.getIngredients();

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

                    const data =
                        this.inventoryService
                            .getDashboardData();

                    this.renderLowStockTable(
                        data.lowStockIngredients
                    );
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

                    const data =
                        this.inventoryService
                            .getDashboardData();

                    this.renderLowStockTable(
                        data.lowStockIngredients
                    );
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

    saveEdit(id) {

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

        const success =
            this.inventoryService.updateIngredient(
                id,
                newQuantity
            );

        if (!success) {

            alert(
                'Unable to update the ingredient.'
            );

            return;
        }

        this.loadInventoryView();
    }

    /* =========================================================
       DELETE
       ========================================================= */

    deleteIngredient(id) {

        const ingredients =
            this.inventoryService.getIngredients();

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

        const success =
            this.inventoryService.deleteIngredient(id);

        if (!success) {

            alert(
                'Unable to delete the ingredient.'
            );

            return;
        }

        /*
         * Reload from page 1 after deletion.
         */

        this.currentStockPage = 1;
        this.currentLowPage = 1;

        this.loadInventoryView();
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
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {
        new InventoryController();
    }
);