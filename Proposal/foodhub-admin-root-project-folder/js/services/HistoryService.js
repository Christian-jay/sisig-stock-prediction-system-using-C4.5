const STORAGE_KEY = 'foodhub_activity_history_v1';

/**
 * Shared audit-log service for FOODHUB.
 * Call HistoryService.log(...) from the controller/service that performs an action.
 * This browser-local implementation is a starter; use a backend for shared permanent logs.
 */
export class HistoryService {
    static getAll() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const logs = saved ? JSON.parse(saved) : [];
            return Array.isArray(logs) ? logs : [];
        } catch (error) {
            console.error('Unable to read FOODHUB history:', error);
            return [];
        }
    }

    static log({ category = 'system', action = 'Activity', reference = '—', details = '', user = 'Admin', result = 'Success', metadata = {} } = {}) {
        const now = new Date();
        // Store timestamp in Manila timezone (ISO format with +08:00 offset)
        const manilaOffset = '+08:00';
        const timestamp = now.toLocaleString('en-CA', { timeZone: 'Asia/Manila', hour12: false }).replace(', ', 'T') + manilaOffset;
        const entry = {
            id: globalThis.crypto?.randomUUID?.() ?? `LOG-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            category: String(category).toLowerCase(),
            action: String(action),
            reference: String(reference ?? '—'),
            details: String(details ?? ''),
            user: String(user || 'Admin'),
            result: String(result || 'Success'),
            timestamp: timestamp,
            metadata: metadata && typeof metadata === 'object' ? metadata : {}
        };

        try {
            const logs = this.getAll();
            logs.unshift(entry);
            // Prevent localStorage from growing without limit.
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 5000)));
            window.dispatchEvent(new CustomEvent('foodhub:history-updated', { detail: entry }));
        } catch (error) {
            console.error('Unable to save FOODHUB history:', error);
        }

        return entry;
    }

    static clear() {
        localStorage.removeItem(STORAGE_KEY);
    }

    static exportRows(logs = this.getAll()) {
        const headers = ['Reference', 'Category', 'Action', 'Details', 'User', 'Result', 'Timestamp'];
        const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
        return [headers, ...logs.map(log => [log.reference, log.category, log.action, log.details, log.user, log.result, log.timestamp])]
            .map(row => row.map(quote).join(','))
            .join('\r\n');
    }
}
