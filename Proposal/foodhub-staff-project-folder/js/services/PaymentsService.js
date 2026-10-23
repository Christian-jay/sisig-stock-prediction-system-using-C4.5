import { PaymentModel } from '../models/PaymentsModel.js';

export class PaymentService {
    constructor() {
        this.storageKey = 'foodhub_payments';
        this.initializeDefaultPayments();
    }

    /* =========================================================
       INITIALIZE DEFAULT PAYMENTS (Mock Data)
       ========================================================= */
    initializeDefaultPayments() {
        const existing = localStorage.getItem(this.storageKey);
        if (existing) return;

        const defaultPayments = [
            { id: '#1001', date: 'Apr 27, 2025 - 10:24 AM', customer: 'Juan Dela Cruz', method: 'Cash', amount: 55.00, status: 'Paid' },
            { id: '#1002', date: 'Apr 27, 2025 - 10:17 AM', customer: 'Marie Santos', method: 'GCash', amount: 85.00, status: 'Paid' },
            { id: '#1003', date: 'Apr 27, 2025 - 10:12 AM', customer: 'Carlos Reyes', method: 'Maya', amount: 120.00, status: 'Paid' },
            { id: '#1004', date: 'Apr 27, 2025 - 09:58 AM', customer: 'Ana Lim', method: 'Panda', amount: 150.00, status: 'Paid' },
            { id: '#1005', date: 'Apr 27, 2025 - 09:45 AM', customer: 'Rafael Cruz', method: 'GCash', amount: 120.00, status: 'Paid' },
            { id: '#1006', date: 'Apr 27, 2025 - 09:30 AM', customer: 'Liza Fernandez', method: 'Cash', amount: 255.00, status: 'Paid' },
            { id: '#1007', date: 'Apr 27, 2025 - 09:21 AM', customer: 'Michael Tan', method: 'Maya', amount: 185.00, status: 'Paid' },
            { id: '#1008', date: 'Apr 27, 2025 - 08:55 AM', customer: 'Patricia Garcia', method: 'Panda', amount: 150.00, status: 'Paid' },
            { id: '#1009', date: 'Apr 27, 2025 - 08:40 AM', customer: 'Jayson Reyes', method: 'GCash', amount: 170.00, status: 'Paid' },
            { id: '#1010', date: 'Apr 27, 2025 - 08:32 AM', customer: 'Bee Cruz', method: 'Cash', amount: 120.00, status: 'Paid' }
        ];

        localStorage.setItem(this.storageKey, JSON.stringify(defaultPayments));
    }

    /* =========================================================
       GET ALL PAYMENTS
       ========================================================= */
    getPayments() {
        try {
            const raw = JSON.parse(localStorage.getItem(this.storageKey)) || [];
            return raw.map(item => new PaymentModel(item));
        } catch (error) {
            console.error('Error reading payments from storage:', error);
            return [];
        }
    }

    /* =========================================================
       GET DASHBOARD METRICS (By Payment Method Breakdown)
       ========================================================= */
    getPaymentMetrics() {
        const payments = this.getPayments();

        const getSummaryByMethod = (methodName) => {
            const filtered = payments.filter(p => p.method.toLowerCase() === methodName.toLowerCase());
            const count = filtered.length;
            const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);
            return { count, totalAmount };
        };

        return {
            cash: getSummaryByMethod('Cash'),
            gcash: getSummaryByMethod('GCash'),
            maya: getSummaryByMethod('Maya'),
            panda: getSummaryByMethod('Panda'),
            allPayments: payments
        };
    }

    /* =========================================================
       ADD NEW PAYMENT TRANSACTION
       ========================================================= */
    addPayment(paymentData) {
        const payments = this.getPayments();
        const newPayment = new PaymentModel(paymentData);

        payments.unshift(newPayment); // I-lagay sa pinakataas
        localStorage.setItem(this.storageKey, JSON.stringify(payments));
        return newPayment;
    }
}