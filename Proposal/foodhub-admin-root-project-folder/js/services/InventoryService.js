import { InventoryItem } from '../models/InventoryModel.js';

export class InventoryService {
    constructor() {
        // Expanded to 15 sample items
        this.items = [
            new InventoryItem(1, 'Toyo', 5, 'L', 3, 'Medium'),
            new InventoryItem(2, 'Mayo', 2, 'kg', 5, 'High'),
            new InventoryItem(3, 'Egg', 20, 'pcs', 10, 'High'),
            new InventoryItem(4, 'Pork', 3, 'kg', 5, 'High'),
            new InventoryItem(5, 'Sili green', 1, 'kg', 2, 'Low'),
            new InventoryItem(6, 'Sibuyas', 2, 'kg', 3, 'Medium'),
            new InventoryItem(7, 'Kalamansi', 1, 'kg', 3, 'High'),
            new InventoryItem(8, 'Suka', 8, 'L', 4, 'Medium'),
            new InventoryItem(9, 'Bawang', 0, 'kg', 2, 'High'),
            new InventoryItem(10, 'Mantika', 4, 'L', 5, 'High'),
            new InventoryItem(11, 'Asukal', 10, 'kg', 4, 'Medium'),
            new InventoryItem(12, 'Paminta', 0.5, 'kg', 1, 'Low'),
            new InventoryItem(13, 'Patis', 3, 'L', 2, 'Medium'),
            new InventoryItem(14, 'Hotdog', 15, 'pcs', 10, 'High'),
            new InventoryItem(15, 'Cheese', 4, 'kg', 5, 'High')
        ];
    }

    /**
     * Kukunin ang lahat ng items (kapag kailangan ng C4.5 algorithm o buong analytics/donut chart)
     */
    getItems() {
        return this.items;
    }

    /**
     * Kukunin ang items batay sa napiling page at limit para sa Table Pagination
     * @param {number} page - Current page number (default: 1)
     * @param {number} limit - Ilang items kada page (default: 5 items bawat pahina)
     */
    getItemsPaginated(page = 1, limit = 5) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const paginatedItems = this.items.slice(startIndex, endIndex);
        const totalPages = Math.ceil(this.items.length / limit);

        return {
            items: paginatedItems,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: this.items.length,
                limit: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }
}