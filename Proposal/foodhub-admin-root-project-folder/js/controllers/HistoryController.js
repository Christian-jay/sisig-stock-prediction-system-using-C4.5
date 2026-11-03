import { HistoryService } from '../services/HistoryService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

class HistoryController {
    constructor() {
        this.itemsPerPage = 10;
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalLogs = 0;
        this.activeFilter = 'all';
        this.searchQuery = '';
        this.fromDate = '';
        this.toDate = '';
        this.visibleLogs = [];
        this.requestId = 0;

        this.tableBody = document.getElementById('historyTableBody');
        this.pageInfo = document.getElementById('historyPageInfo');
        this.prevBtn = document.getElementById('historyPrevBtn');
        this.nextBtn = document.getElementById('historyNextBtn');
        this.searchInput = document.getElementById('historySearchInput');
        this.fromInput = document.getElementById('historyFromDate');
        this.toInput = document.getElementById('historyToDate');
        this.exportButton = document.getElementById('exportHistoryBtn');

        this.bindEvents();
        this.refresh();
    }

    bindEvents() {
        document.querySelectorAll('#historyFilterTabs [data-filter]').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeFilter = tab.dataset.filter || 'all';
                document.querySelectorAll('#historyFilterTabs [data-filter]').forEach(item => {
                    item.classList.toggle('active', item === tab);
                });
                this.applyFilters();
            });
        });

        this.searchInput?.addEventListener('input', () => {
            this.searchQuery = this.searchInput.value.trim();
            this.applyFilters();
        });
        this.fromInput?.addEventListener('change', () => {
            this.fromDate = this.fromInput.value;
            this.applyFilters();
        });
        this.toInput?.addEventListener('change', () => {
            this.toDate = this.toInput.value;
            this.applyFilters();
        });
        this.prevBtn?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage -= 1;
                this.loadPage();
            }
        });
        this.nextBtn?.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage += 1;
                this.loadPage();
            }
        });
        document.getElementById('clearHistoryFiltersBtn')?.addEventListener('click', () => {
            this.activeFilter = 'all';
            this.searchQuery = '';
            this.fromDate = '';
            this.toDate = '';
            if (this.searchInput) this.searchInput.value = '';
            if (this.fromInput) this.fromInput.value = '';
            if (this.toInput) this.toInput.value = '';
            document.querySelectorAll('#historyFilterTabs [data-filter]').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.filter === 'all');
            });
            this.applyFilters();
        });
        this.exportButton?.addEventListener('click', () => this.exportCSV());
    }

    async refresh() {
        this.currentPage = 1;
        await this.loadPage();
    }

    getQueryParams(includePage = true) {
        const params = {
            category: this.activeFilter === 'all' ? '' : this.activeFilter,
            search: this.searchQuery,
            date_from: this.fromDate,
            date_to: this.toDate
        };
        if (includePage) {
            params.page = this.currentPage;
            params.page_size = this.itemsPerPage;
        }
        return params;
    }

    async applyFilters() {
        this.currentPage = 1;
        await this.loadPage();
    }

    async loadPage() {
        const requestId = ++this.requestId;
        this.setLoading(true);

        try {
            const response = await HistoryService.getPage(this.getQueryParams());
            if (requestId !== this.requestId) return;

            this.visibleLogs = response.results || [];
            this.totalLogs = Number(response.count) || 0;
            this.totalPages = Math.max(Number(response.total_pages) || 1, 1);
            this.currentPage = Math.max(Number(response.current_page) || this.currentPage, 1);
            this.updateSummary(response.summary, this.totalLogs);
            this.render();
        } catch (error) {
            if (requestId !== this.requestId) return;
            console.error('[HistoryController] Failed to load history:', error);
            this.visibleLogs = [];
            this.totalLogs = 0;
            this.totalPages = 1;
            this.updateSummary({}, 0);
            this.renderError('Unable to load activity history. Please try again.');
        } finally {
            if (requestId === this.requestId) this.setLoading(false);
        }
    }

    updateSummary(summary = {}, fallbackTotal = 0) {
        const settings = Number(summary.settings) || 0;
        const system = Number(summary.system) || 0;
        this.setText('totalLogsCount', summary.total_logs ?? fallbackTotal);
        this.setText('orderLogsCount', summary.orders || 0);
        this.setText('inventoryLogsCount', summary.inventory || 0);
        this.setText('systemLogsCount', summary.system_admin ?? settings + system);
    }

    render() {
        if (!this.tableBody) return;

        const visible = this.visibleLogs;
        const start = this.totalLogs
            ? (this.currentPage - 1) * this.itemsPerPage
            : 0;

        if (!visible.length) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">No activity found for the selected filters.</td>
                </tr>`;
        } else {
            this.tableBody.innerHTML = visible.map((log, index) => {
                const category = this.normalizeCategory(log.category);
                const result = String(log.result || 'Success').toLowerCase();
                const resultClass = result.includes('fail') || result.includes('error')
                    ? 'result-failed'
                    : result.includes('pending') || result.includes('warning')
                        ? 'result-warning'
                        : 'result-success';

                return `<tr>
                    <td>${start + index + 1}</td>
                    <td class="reference-cell">${this.escape(log.reference || log.id || '—')}</td>
                    <td><span class="category-badge category-${category}">${this.escape(log.categoryDisplay || this.label(category))}</span></td>
                    <td class="detail-cell"><strong>${this.escape(log.action || 'Activity')}</strong><br>${this.escape(log.details || '—')}</td>
                    <td class="user-cell">${this.escape(log.user || 'System')}</td>
                    <td><span class="result-badge ${resultClass}">${this.escape(log.result || 'Success')}</span></td>
                    <td class="timestamp-cell">${this.formatDate(log.timestamp)}</td>
                </tr>`;
            }).join('');
        }

        if (this.pageInfo) {
            this.pageInfo.textContent = this.totalLogs
                ? `Showing ${start + 1}–${Math.min(start + visible.length, this.totalLogs)} of ${this.totalLogs} logs · Page ${this.currentPage} of ${this.totalPages}`
                : 'No activity recorded';
        }
        if (this.prevBtn) this.prevBtn.disabled = this.currentPage <= 1;
        if (this.nextBtn) this.nextBtn.disabled = this.totalLogs === 0 || this.currentPage >= this.totalPages;
    }

    renderError(message) {
        if (this.tableBody) {
            this.tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">${this.escape(message)}</td></tr>`;
        }
        if (this.pageInfo) this.pageInfo.textContent = 'History unavailable';
        if (this.prevBtn) this.prevBtn.disabled = true;
        if (this.nextBtn) this.nextBtn.disabled = true;
    }

    setLoading(isLoading) {
        if (this.tableBody && isLoading) {
            this.tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Loading history...</td></tr>';
        }
        if (this.prevBtn && isLoading) this.prevBtn.disabled = true;
        if (this.nextBtn && isLoading) this.nextBtn.disabled = true;
    }

    async exportCSV() {
        if (!this.exportButton) return;
        const originalText = this.exportButton.textContent;
        this.exportButton.disabled = true;
        this.exportButton.textContent = 'Exporting...';

        try {
            const logs = await HistoryService.getAll(this.getQueryParams(false));
            const csv = HistoryService.exportRows(logs);
            const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const manilaDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
            link.download = `foodhub-history-${manilaDate}.csv`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[HistoryController] Failed to export history:', error);
        } finally {
            this.exportButton.disabled = false;
            this.exportButton.textContent = originalText;
        }
    }

    normalizeCategory(category) {
        const value = String(category || 'system').toLowerCase();
        if (['order', 'orders'].includes(value)) return 'orders';
        if (['inventory', 'stock', 'restock'].includes(value)) return 'inventory';
        if (['menu', 'product', 'products'].includes(value)) return 'menu';
        if (['sales', 'report', 'reports'].includes(value)) return 'sales';
        if (['setting', 'settings', 'configuration', 'payment', 'notification'].includes(value)) return 'settings';
        return 'system';
    }

    setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    label(category) {
        return ({
            orders: 'Orders',
            inventory: 'Inventory',
            menu: 'Menu / Products',
            sales: 'Sales & Reports',
            settings: 'Settings',
            system: 'System / Admin'
        })[category] || 'System / Admin';
    }

    formatDate(value) {
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) return 'Unknown date';
        return new Intl.DateTimeFormat('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }

    escape(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HistoryController();
    loadSidebarNav();
    loadTopNavbar();
});
