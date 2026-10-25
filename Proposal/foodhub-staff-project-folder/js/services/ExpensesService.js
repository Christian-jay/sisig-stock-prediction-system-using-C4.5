import { ExpensesSummaryModel, ExpenseRecordModel, ReplenishIngredientModel } from '../models/ExpensesModel.js';

export class ExpensesService {
    getExpensesData() {
        // Mock data base sa ibinigay na UI Design
        const rawExpenseRecords = [
            { id: '1', timestamp: '2025-04-27T10:24:00Z', description: 'Rice (5kg)', category: 'Supplies', amount: 250.00 },
            { id: '2', timestamp: '2025-04-27T09:45:00Z', description: 'Cooking Oil (1L)', category: 'Supplies', amount: 180.00 },
            { id: '3', timestamp: '2025-04-27T08:30:00Z', description: 'Gas (LPG)', category: 'Utilities', amount: 300.00 },
            { id: '4', timestamp: '2025-04-27T07:15:00Z', description: 'Packaging', category: 'Supplies', amount: 220.00 },
            { id: '5', timestamp: '2025-04-26T17:50:00Z', description: 'Cleaning Supplies', category: 'Others', amount: 300.00 }
        ];

        const rawLowStockIngredients = [
            { id: 'ING-1', name: 'Mayo', currentStock: 2, unit: 'kg', status: 'Low Stock' },
            { id: 'ING-2', name: 'Sili green', currentStock: 1, unit: 'kg', status: 'Low Stock' },
            { id: 'ING-3', name: 'Kalamansi', currentStock: 1, unit: 'kg', status: 'Low Stock' },
            { id: 'ING-4', name: 'Lechon Kawali', currentStock: 3, unit: 'pcs', status: 'Low Stock' },
            { id: 'ING-5', name: 'Medium Bilao', currentStock: 1, unit: 'pcs', status: 'Low Stock' },
            { id: 'ING-6', name: 'Small Bilao', currentStock: 2, unit: 'pcs', status: 'Low Stock' },
            { id: 'ING-7', name: 'Sizzling Plate', currentStock: 1, unit: 'pcs', status: 'Low Stock' },
            { id: 'ING-8', name: 'Pork', currentStock: 3, unit: 'kg', status: 'In Stock' },
            { id: 'ING-9', name: 'Egg', currentStock: 6, unit: 'pcs', status: 'In Stock' },
            { id: 'ING-10', name: 'Chicken', currentStock: 5, unit: 'kg', status: 'In Stock' }
        ];

        const expenseRecords = rawExpenseRecords.map(item => new ExpenseRecordModel(item));
        const lowStockIngredients = rawLowStockIngredients.map(item => new ReplenishIngredientModel(item));

        // Computations para sa stat cards
        const totalExpenses = expenseRecords.reduce((sum, item) => sum + item.amount, 0);
        const totalTransactions = expenseRecords.length;
        const averageExpense = totalTransactions > 0 ? (totalExpenses / totalTransactions) : 0;

        // Kunin ang Highest Category sa pamamagitan ng grouping
        const categoryTotals = {};
        expenseRecords.forEach(item => {
            categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
        });

        let highestCategoryName = 'Supplies';
        let highestCategoryAmount = 0;
        for (const [cat, amt] of Object.entries(categoryTotals)) {
            if (amt > highestCategoryAmount) {
                highestCategoryAmount = amt;
                highestCategoryName = cat;
            }
        }

        return new ExpensesSummaryModel({
            totalExpenses,
            totalTransactions,
            highestCategoryName,
            highestCategoryAmount,
            averageExpense,
            expenseRecords,
            lowStockIngredients
        });
    }

    addExpenseRecord(recordData) {
        console.warn("Static mode: Expense added temporarily in view. Update ExpensesService.js to save permanently.");
        return new ExpenseRecordModel(recordData);
    }
}