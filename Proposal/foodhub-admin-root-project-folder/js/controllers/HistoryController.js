import { HistoryService } from '../services/HistoryService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

class HistoryController {
    constructor() {
        this.itemsPerPage = 10;
        this.currentPage = 1;
        this.activeFilter = 'all';
        this.searchQuery = '';
        this.fromDate = '';
        this.toDate = '';
        this.allLogs = [];
        this.filteredLogs = [];

        this.tableBody = document.getElementById('historyTableBody');
        this.pageInfo = document.getElementById('historyPageInfo');
        this.prevBtn = document.getElementById('historyPrevBtn');
        this.nextBtn = document.getElementById('historyNextBtn');
        this.searchInput = document.getElementById('historySearchInput');
        this.fromInput = document.getElementById('historyFromDate');
        this.toInput = document.getElementById('historyToDate');

        this.bindEvents();
        this.refresh();
        window.addEventListener('foodhub:history-updated', () => this.refresh());
        window.addEventListener('storage', event => {
            if (event.key === 'foodhub_activity_history_v1') this.refresh();
        });
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
            this.searchQuery = this.searchInput.value.trim().toLowerCase();
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
            if (this.currentPage > 1) { this.currentPage--; this.render(); }
        });
        this.nextBtn?.addEventListener('click', () => {
            const pages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
            if (this.currentPage < pages) { this.currentPage++; this.render(); }
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
        document.getElementById('exportHistoryBtn')?.addEventListener('click', () => this.exportCSV());
    }

    refresh() {
        this.allLogs = HistoryService.getAll().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.updateSummary();
        this.applyFilters();
    }

    updateSummary() {
        const count = category => this.allLogs.filter(log => this.normalizeCategory(log.category) === category).length;
        this.setText('totalLogsCount', this.allLogs.length);
        this.setText('orderLogsCount', count('orders'));
        this.setText('inventoryLogsCount', count('inventory'));
        this.setText('systemLogsCount', this.allLogs.filter(log => ['settings', 'system'].includes(this.normalizeCategory(log.category))).length);
    }

    applyFilters() {
        const from = this.fromDate ? new Date(`${this.fromDate}T00:00:00`) : null;
        const to = this.toDate ? new Date(`${this.toDate}T23:59:59.999`) : null;

        this.filteredLogs = this.allLogs.filter(log => {
            const category = this.normalizeCategory(log.category);
            const matchesCategory = this.activeFilter === 'all' || category === this.activeFilter;
            const searchable = [log.id, log.reference, log.category, log.action, log.details, log.user, log.result]
                .join(' ').toLowerCase();
            const matchesSearch = !this.searchQuery || searchable.includes(this.searchQuery);
            const date = new Date(log.timestamp);
            const matchesFrom = !from || (Number.isFinite(date.getTime()) && date >= from);
            const matchesTo = !to || (Number.isFinite(date.getTime()) && date <= to);
            return matchesCategory && matchesSearch && matchesFrom && matchesTo;
        });

        this.currentPage = 1;
        this.render();
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

    render() {
        if (!this.tableBody) return;
        const total = this.filteredLogs.length;
        const pages = Math.max(1, Math.ceil(total / this.itemsPerPage));
        this.currentPage = Math.min(Math.max(1, this.currentPage), pages);
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const visible = this.filteredLogs.slice(start, start + this.itemsPerPage);

        if (!visible.length) {
            this.tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">No activity found. Actions will appear here after they are recorded by the application.</td></tr>`;
        } else {
            this.tableBody.innerHTML = visible.map((log, index) => {
                const category = this.normalizeCategory(log.category);
                const result = String(log.result || 'Success').toLowerCase();
                const resultClass = result.includes('fail') || result.includes('error') ? 'result-failed' : result.includes('pending') || result.includes('warning') ? 'result-warning' : 'result-success';
                return `<tr>
                    <td>${start + index + 1}</td>
                    <td class="reference-cell">${this.escape(log.reference || log.id || '—')}</td>
                    <td><span class="category-badge category-${category}">${this.escape(this.label(category))}</span></td>
                    <td class="detail-cell"><strong>${this.escape(log.action || 'Activity')}</strong><br>${this.escape(log.details || '—')}</td>
                    <td class="user-cell">${this.escape(log.user || 'Admin')}</td>
                    <td><span class="result-badge ${resultClass}">${this.escape(log.result || 'Success')}</span></td>
                    <td class="timestamp-cell">${this.formatDate(log.timestamp)}</td>
                </tr>`;
            }).join('');
        }

        if (this.pageInfo) {
            this.pageInfo.textContent = total ? `Showing ${start + 1}–${Math.min(start + visible.length, total)} of ${total} logs · Page ${this.currentPage} of ${pages}` : 'No activity recorded';
        }
        if (this.prevBtn) this.prevBtn.disabled = this.currentPage <= 1;
        if (this.nextBtn) this.nextBtn.disabled = total === 0 || this.currentPage >= pages;
    }

    exportCSV() {
        const csv = HistoryService.exportRows(this.filteredLogs);
        const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `foodhub-history-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    label(category) {
        return ({ orders: 'Orders', inventory: 'Inventory', menu: 'Menu / Products', sales: 'Sales & Reports', settings: 'Settings', system: 'System / Admin' })[category] || 'System / Admin';
    }

    formatDate(value) {
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) return 'Unknown date';
        return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
    }

    escape(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HistoryController()
    loadSidebarNav();
    loadTopNavbar();
});
