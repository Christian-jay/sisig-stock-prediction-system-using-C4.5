export class ExpenseRecordModel {
    constructor(data = {}) {
        this.id = data.id || `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
        // Store timestamp in Manila timezone (ISO format with +08:00 offset)
        const now = new Date();
        const manilaOffset = '+08:00';
        this.timestamp = data.timestamp || now.toLocaleString('en-CA', { timeZone: 'Asia/Manila', hour12: false }).replace(', ', 'T') + manilaOffset;
        this.description = data.description || '';
        this.category = data.category || 'Supplies'; // Supplies, Utilities, Others, Ingredients
        this.amount = data.amount || 0;
    }

    getFormattedDateTime() {
        try {
            const dateObj = new Date(this.timestamp);
            const dateStr = dateObj.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: '2-digit', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true });
            return `${dateStr} - ${timeStr}`;
        } catch (e) {
            return this.timestamp;
        }
    }
}

export class ReplenishIngredientModel {
    constructor(data = {}) {
        this.id = data.id || `ING-${Math.floor(1000 + Math.random() * 9000)}`;
        this.name = data.name || '';
        this.currentStock = data.currentStock !== undefined ? data.currentStock : 0;
        this.unit = data.unit || 'kg';
        this.status = data.status || (this.currentStock <= 2 ? 'Low Stock' : 'In Stock');
        this.image = data.image || '';
    }
}

export class ExpensesSummaryModel {
    constructor(data = {}) {
        this.totalExpenses = data.totalExpenses || 0;
        this.totalTransactions = data.totalTransactions || 0;
        this.highestCategoryName = data.highestCategoryName || 'N/A';
        this.highestCategoryAmount = data.highestCategoryAmount || 0;
        this.averageExpense = data.averageExpense || 0;

        this.expenseRecords = (data.expenseRecords || []).map(item => new ExpenseRecordModel(item));
        this.lowStockIngredients = (data.lowStockIngredients || []).map(item => new ReplenishIngredientModel(item));
    }
}