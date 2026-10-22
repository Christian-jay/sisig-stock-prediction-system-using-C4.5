/**
 * History & Audit Log Entity Definitions
 */
export class HistoryLogItem {
    constructor(id, reference, category, description, status, timestamp) {
        this.id = id;
        this.reference = reference;       // e.g., ORD-1024, INV-05, SYS-01
        this.category = category;         // 'orders', 'inventory', 'settings'
        this.description = description;   // Detalye ng nangyari
        this.status = status;             // 'Completed', 'Warning', 'Updated', etc.
        this.timestamp = timestamp;       // Petsa at oras
    }
}