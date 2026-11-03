import { apiGet } from '../utils/api.js';
import { HistoryLogItem } from '../models/HistoryModel.js';

const HISTORY_API_BASE = '/history/logs';

/**
 * Handles authenticated requests for the persistent server-side audit log.
 */
export class HistoryService {
    static buildQuery(params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.set(key, value);
            }
        });
        return query.toString();
    }

    static async getPage(params = {}) {
        const query = this.buildQuery(params);
        const response = await apiGet(`${HISTORY_API_BASE}/${query ? `?${query}` : ''}`);
        return {
            ...response,
            results: (response.results || []).map(item => new HistoryLogItem(item)),
            summary: response.summary || {}
        };
    }

    static async getAll(params = {}) {
        const pageSize = Math.min(Number(params.page_size) || 100, 100);
        const firstPage = await this.getPage({
            ...params,
            page: 1,
            page_size: pageSize
        });
        const logs = [...firstPage.results];
        const totalPages = Number(firstPage.total_pages) || 1;

        for (let page = 2; page <= totalPages; page++) {
            const nextPage = await this.getPage({
                ...params,
                page,
                page_size: pageSize
            });
            logs.push(...nextPage.results);
        }

        return logs;
    }

    static exportRows(logs = []) {
        const headers = [
            'Reference', 'Category', 'Action', 'Details',
            'User', 'Result', 'Timestamp'
        ];
        const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
        return [
            headers,
            ...logs.map(log => [
                log.reference,
                log.categoryDisplay || log.category,
                log.action,
                log.details,
                log.user,
                log.result,
                log.timestamp
            ])
        ]
            .map(row => row.map(quote).join(','))
            .join('\r\n');
    }
}
