import { InventoryService } from '../services/InventoryService.js';
import { C45AlgorithmService } from '../services/C45AlgorithmService.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';

class InventoryController {

    constructor() {
        this.service = new InventoryService();

        this.itemsPerPage = 12;
        this.currentPage = 1;

        this.alertsPerPage = 3;
        this.currentAlertPage = 1;
        this.currentAlerts = [];

        this.priorityItemsPerPage = 3;
        this.currentPriorityPage = 1;
        this.currentPriorityItems = [];

        this.initDOM();

        this.initPagination();
        this.initAlertPagination();
        this.initPriorityPagination();

        this.initFilters();

        this.render();
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

        // Existing table pagination
        this.prevPageBtn = document.getElementById("prevPageBtn");
        this.nextPageBtn = document.getElementById("nextPageBtn");
        this.pageInfo = document.getElementById("pageInfo");

        //Status filter and Category Filter
        this.statusFilter = document.getElementById("statusFilter");
        this.categoryFilter = document.getElementById("categoryFilter");
        this.searchInput = document.querySelector(".search-box input");

        // Table
        this.tableBody = document.getElementById('inventoryTableBody');

        // Summary
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

        // Alerts
        this.alertList = document.getElementById('inventoryAlertList');
        this.alertCount = document.getElementById('alertCount');

        // C4.5
        this.highRiskCount = document.getElementById('highRiskCount');
        this.mediumRiskCount = document.getElementById('mediumRiskCount');
        this.lowRiskCount = document.getElementById('lowRiskCount');

        this.c45Recommendation =
            document.getElementById('c45Recommendation');
    }


    // =========================================================
    // MAIN RENDER
    // =========================================================

    render() {
        const rawItems = this.service.getItems();

        const processedItems =
            C45AlgorithmService.classifyInventory(rawItems);

        this.renderSummary(processedItems);
        this.renderTable(processedItems);
        this.renderLowStockAlerts(processedItems);
        this.renderPriorityList(processedItems); // Add this
        this.renderC45Analysis(processedItems);
        this.renderDonutChart(processedItems);
    }


    // =========================================================
    // INVENTORY SUMMARY
    // =========================================================

    renderSummary(items) {

        const total = items.length;

        const inStock = items.filter(
            item => item.c45Classification === 'In Stock'
        ).length;

        const lowStock = items.filter(
            item => item.c45Classification === 'Low Stock'
        ).length;

        const outOfStock = items.filter(
            item => item.c45Classification === 'Out of Stock'
        ).length;


        if (this.totalItemsCount) {
            this.totalItemsCount.textContent = total;
        }

        if (this.inStockCount) {
            this.inStockCount.textContent = inStock;
        }

        if (this.lowStockCount) {
            this.lowStockCount.textContent = lowStock;
        }

        if (this.outStockCount) {
            this.outStockCount.textContent = outOfStock;
        }

        if (this.chartTotal) {
            this.chartTotal.textContent = total;
        }
    }


    initFilters() {
        const update = () => this.renderFilteredTable();

        this.statusFilter?.addEventListener("change", update);
        this.categoryFilter?.addEventListener("change", update);
        this.searchInput?.addEventListener("input", update);
    }


    renderFilteredTable() {
        const items = C45AlgorithmService.classifyInventory(
            this.service.getItems()
        );

        const status = this.statusFilter?.value ?? "all";
        const category = this.categoryFilter?.value ?? "all";
        const search = (this.searchInput?.value ?? "")
            .trim()
            .toLowerCase();

        const statusMap = {
            instock: "In Stock",
            lowstock: "Low Stock",
            outstock: "Out of Stock"
        };

        const categoryMap = {
            meat: "Meat",
            vegetable: "Vegetables",
            sauce: "Sauces",
            others: "Others"
        };

        const filteredItems = items.filter(item => {
            const matchesStatus =
                status === "all" ||
                item.c45Classification === statusMap[status];

            const matchesCategory =
                category === "all" ||
                this.getCategory(item.name) === categoryMap[category];

            const matchesSearch =
                String(item.name).toLowerCase().includes(search);

            return matchesStatus && matchesCategory && matchesSearch;
        });

        // Reset pagination whenever the filters change.
        this.currentPage = 1;

        // Render the filtered results using your existing pagination.
        this.renderTable(filteredItems);
    }


    // =========================================================
    // INVENTORY TABLE
    // =========================================================



    renderTable(items) {
        if (!this.tableBody) return;

        this.currentItems = items;

        const totalPages = Math.max(
            1,
            Math.ceil(items.length / this.itemsPerPage)
        );

        // Keep the current page valid
        this.currentPage = Math.min(this.currentPage, totalPages);

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const pageItems = items.slice(
            startIndex,
            startIndex + this.itemsPerPage
        );

        this.tableBody.innerHTML = pageItems.map((item, index) => {
            const statusClasses = {
                "In Stock": "instock",
                "Low Stock": "lowstock",
                "Out of Stock": "outstock"
            };

            const badgeClass =
                statusClasses[item.c45Classification] ?? "outstock";

            const safeName = this.escapeHTML(item.name);
            const safeUnit = this.escapeHTML(item.unit);
            const safeDemand = this.escapeHTML(item.demandRate);
            const safeId = this.escapeHTML(item.id);

            return `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td><strong>${safeName}</strong></td>
                <td>${this.getCategory(item.name)}</td>
                <td>${item.quantity} ${safeUnit}</td>
                <td>${item.reorderPoint} ${safeUnit}</td>
                <td>${safeDemand}</td>
                <td>
                    <span class="badge ${badgeClass}">
                        ${item.c45Classification}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button
                            class="action-btn secondary btn-sm"
                            data-action="edit"
                            data-id="${safeId}">
                            Edit
                        </button>

                        <button
                            class="action-btn danger btn-sm"
                            data-action="delete"
                            data-id="${safeId}">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
        }).join("");

        // Update the existing pagination controls
        if (this.pageInfo) {
            this.pageInfo.textContent =
                `Page ${this.currentPage} of ${totalPages}`;
        }

        if (this.prevPageBtn) {
            this.prevPageBtn.disabled = this.currentPage === 1;
        }

        if (this.nextPageBtn) {
            this.nextPageBtn.disabled = this.currentPage === totalPages;
        }
    }

    escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }



    // =========================================================
    // CATEGORY
    // =========================================================

    getCategory(name) {

        const meat = [
            'Pork',
            'Chicken',
            'Beef'
        ];

        const vegetables = [
            'Sili green',
            'Sibuyas',
            'Kalamansi'
        ];

        const sauces = [
            'Toyo',
            'Mayo'
        ];


        if (meat.includes(name)) {
            return 'Meat';
        }

        if (vegetables.includes(name)) {
            return 'Vegetables';
        }

        if (sauces.includes(name)) {
            return 'Sauces';
        }

        return 'Others';
    }


    // =========================================================
    // INVENTORY ALERTS
    // =========================================================



    renderLowStockAlerts(items) {
        if (!this.alertList) return;

        const criticalItems = items.filter(item =>
            item.c45Classification === "Low Stock" ||
            item.c45Classification === "Out of Stock"
        );

        // Update the total alert count
        if (this.alertCount) {
            this.alertCount.textContent = criticalItems.length;
        }

        // Save alerts for pagination
        this.currentAlerts = criticalItems;
        this.currentAlertPage = 1;

        if (criticalItems.length === 0) {
            this.alertList.innerHTML = `
            <div class="alert-item healthy">
                <span class="alert-dot"></span>
                <div class="alert-content">
                    <strong>All stock levels are healthy!</strong>
                    <span>No ingredients need restocking right now.</span>
                </div>
            </div>
        `;

            if (this.alertPageInfo) {
                this.alertPageInfo.textContent = "Page 1 of 1";
            }

            if (this.alertPrevPageBtn) {
                this.alertPrevPageBtn.disabled = true;
            }

            if (this.alertNextPageBtn) {
                this.alertNextPageBtn.disabled = true;
            }

            return;
        }

        this.renderAlertPage();
    }


    // =========================================================
    // C4.5 ANALYSIS
    // =========================================================

    renderC45Analysis(items) {

        const highRisk = items.filter(item =>
            item.c45Classification === 'Out of Stock'
        ).length;


        const mediumRisk = items.filter(item =>
            item.c45Classification === 'Low Stock'
        ).length;


        const lowRisk = items.filter(item =>
            item.c45Classification === 'In Stock'
        ).length;


        if (this.highRiskCount) {
            this.highRiskCount.textContent = highRisk;
        }


        if (this.mediumRiskCount) {
            this.mediumRiskCount.textContent = mediumRisk;
        }


        if (this.lowRiskCount) {
            this.lowRiskCount.textContent = lowRisk;
        }


        if (this.c45Recommendation) {

            if (highRisk > 0) {

                this.c45Recommendation.textContent =
                    `${highRisk} ingredient${highRisk > 1 ? 's' : ''} require immediate restocking based on current stock levels.`;

            } else if (mediumRisk > 0) {

                this.c45Recommendation.textContent =
                    `${mediumRisk} ingredient${mediumRisk > 1 ? 's' : ''} require monitoring because stock is below the reorder level.`;

            } else {

                this.c45Recommendation.textContent =
                    'All ingredients are currently at healthy stock levels.';
            }
        }
    }


    // =========================================================
    // DONUT CHART
    // =========================================================


    renderDonutChart(items) {
        const total = items.length;

        const counts = {
            inStock: items.filter(
                item => item.c45Classification === "In Stock"
            ).length,
            lowStock: items.filter(
                item => item.c45Classification === "Low Stock"
            ).length,
            outStock: items.filter(
                item => item.c45Classification === "Out of Stock"
            ).length
        };

        const percentages = total === 0
            ? { inStock: 0, lowStock: 0, outStock: 0 }
            : {
                inStock: Math.round(counts.inStock / total * 100),
                lowStock: Math.round(counts.lowStock / total * 100),
                outStock: 0
            };

        percentages.outStock = total === 0
            ? 0
            : 100 - percentages.inStock - percentages.lowStock;

        if (this.chartTotal) {
            this.chartTotal.textContent = total;
        }

        const percentageElements = [
            [this.inStockPercentage, percentages.inStock],
            [this.lowStockPercentage, percentages.lowStock],
            [this.outStockPercentage, percentages.outStock]
        ];

        percentageElements.forEach(([element, value]) => {
            if (element) element.textContent = `${value}%`;
        });

        const segments = [
            [this.inStockSegment, percentages.inStock, 25],
            [
                this.lowStockSegment,
                percentages.lowStock,
                25 - percentages.inStock
            ],
            [
                this.outStockSegment,
                percentages.outStock,
                25 - percentages.inStock - percentages.lowStock
            ]
        ];

        segments.forEach(([element, percentage, offset]) => {
            if (!element) return;

            element.setAttribute(
                "stroke-dasharray",
                `${percentage} ${100 - percentage}`
            );

            element.setAttribute("stroke-dashoffset", String(offset));
        });
    }


    initPagination() {
        this.prevPageBtn?.addEventListener("click", () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTable(this.currentItems);
            }
        });

        this.nextPageBtn?.addEventListener("click", () => {
            const totalPages = Math.ceil(
                this.currentItems.length / this.itemsPerPage
            );

            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTable(this.currentItems);
            }
        });
    }

    initAlertPagination() {
        this.alertPrevPageBtn?.addEventListener("click", () => {
            if (this.currentAlertPage > 1) {
                this.currentAlertPage--;
                this.renderAlertPage();
            }
        });

        this.alertNextPageBtn?.addEventListener("click", () => {
            const totalPages = Math.max(
                1,
                Math.ceil(this.currentAlerts.length / this.alertsPerPage)
            );

            if (this.currentAlertPage < totalPages) {
                this.currentAlertPage++;
                this.renderAlertPage();
            }
        });
    }


    renderAlertPage() {
        if (!this.alertList) return;

        const totalPages = Math.max(
            1,
            Math.ceil(this.currentAlerts.length / this.alertsPerPage)
        );

        this.currentAlertPage = Math.min(
            this.currentAlertPage,
            totalPages
        );

        const startIndex =
            (this.currentAlertPage - 1) * this.alertsPerPage;

        const visibleAlerts = this.currentAlerts.slice(
            startIndex,
            startIndex + this.alertsPerPage
        );

        this.alertList.innerHTML = visibleAlerts.map(item => {
            const isOutOfStock =
                item.c45Classification === "Out of Stock";

            const alertClass = isOutOfStock ? "critical" : "warning";
            const statusText = isOutOfStock ? "OUT OF STOCK" : "LOW STOCK";

            const safeName = this.escapeHTML(item.name);
            const safeUnit = this.escapeHTML(item.unit);

            return `
            <div class="alert-item ${alertClass}">
                <span class="alert-dot"></span>

                <div class="alert-content">
                    <strong>${safeName}</strong>
                    <span>
                        Current stock: ${item.quantity} ${safeUnit}
                    </span>
                </div>

                <span class="alert-status">${statusText}</span>
            </div>
        `;
        }).join("");

        if (this.alertPageInfo) {
            this.alertPageInfo.textContent =
                `Page ${this.currentAlertPage} of ${totalPages}`;
        }

        if (this.alertPrevPageBtn) {
            this.alertPrevPageBtn.disabled =
                this.currentAlertPage === 1;
        }

        if (this.alertNextPageBtn) {
            this.alertNextPageBtn.disabled =
                this.currentAlertPage === totalPages;
        }
    }


    initPriorityPagination() {
        this.priorityPrevBtn?.addEventListener("click", () => {
            if (this.currentPriorityPage > 1) {
                this.currentPriorityPage--;
                this.renderPriorityPage();
            }
        });

        this.priorityNextBtn?.addEventListener("click", () => {
            const totalPages = Math.max(
                1,
                Math.ceil(
                    this.currentPriorityItems.length /
                    this.priorityItemsPerPage
                )
            );

            if (this.currentPriorityPage < totalPages) {
                this.currentPriorityPage++;
                this.renderPriorityPage();
            }
        });
    }

    renderPriorityList(items) {
        if (!this.priorityList) return;

        // Show low-stock and out-of-stock ingredients
        this.currentPriorityItems = items.filter(item =>
            item.c45Classification === "Low Stock" ||
            item.c45Classification === "Out of Stock"
        );

        this.currentPriorityPage = 1;
        this.renderPriorityPage();
    }

    renderPriorityPage() {
        if (!this.priorityList) return;

        const totalPages = Math.max(
            1,
            Math.ceil(
                this.currentPriorityItems.length /
                this.priorityItemsPerPage
            )
        );

        this.currentPriorityPage = Math.min(
            this.currentPriorityPage,
            totalPages
        );

        const startIndex =
            (this.currentPriorityPage - 1) *
            this.priorityItemsPerPage;

        const visibleItems = this.currentPriorityItems.slice(
            startIndex,
            startIndex + this.priorityItemsPerPage
        );

        if (visibleItems.length === 0) {
            this.priorityList.innerHTML = `
            <div class="priority-item">
                <div class="priority-info">
                    <div>
                        <strong>All stock levels are healthy!</strong>
                        <span>No priority items right now.</span>
                    </div>
                </div>
            </div>
        `;
        } else {
            this.priorityList.innerHTML = visibleItems.map(item => {
                const isCritical =
                    item.c45Classification === "Out of Stock";

                const type = isCritical ? "critical" : "warning";
                const label = isCritical ? "Critical" : "Low";

                const safeName = this.escapeHTML(item.name);
                const safeUnit = this.escapeHTML(item.unit);

                return `
                <div class="priority-item ${type}">
                    <div class="priority-info">
                        <div class="priority-icon">!</div>

                        <div>
                            <strong>${safeName}</strong>
                            <span>
                                ${item.quantity} ${safeUnit} remaining
                            </span>
                        </div>
                    </div>

                    <span class="priority-badge">${label}</span>
                </div>
            `;
            }).join("");
        }

        if (this.priorityPageInfo) {
            this.priorityPageInfo.textContent =
                `Page ${this.currentPriorityPage} of ${totalPages}`;
        }

        if (this.priorityPrevBtn) {
            this.priorityPrevBtn.disabled =
                this.currentPriorityPage === 1;
        }

        if (this.priorityNextBtn) {
            this.priorityNextBtn.disabled =
                this.currentPriorityPage === totalPages;
        }
    }


}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    new InventoryController();
    loadSidebarNav();
    loadTopNavbar();
});