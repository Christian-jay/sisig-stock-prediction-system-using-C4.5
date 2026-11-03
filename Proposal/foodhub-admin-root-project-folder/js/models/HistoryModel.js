/**
 * History & Audit Log Entity Definitions
 */
export class HistoryLogItem {
    constructor(data = {}) {
        this.id = data.id ?? '';
        this.reference = data.reference || '—';
        this.category = data.category || 'system';
        this.categoryDisplay = data.category_display || '';
        this.action = data.action || 'Activity';
        this.details = data.details || '';
        this.user = data.user_name || data.user || 'System';
        this.result = data.result || 'Success';
        this.timestamp = data.timestamp || null;
        this.metadata = data.metadata && typeof data.metadata === 'object'
            ? data.metadata
            : {};
    }
}