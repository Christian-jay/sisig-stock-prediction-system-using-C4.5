export class TodaysOrdersModel {
    constructor(orderData = {}) {
        this.id = orderData.id || `#${Math.floor(1000 + Math.random() * 9000)}`;
        this.timestamp = orderData.timestamp || new Date().toISOString();
        this.items = orderData.items || [];
        this.subtotal = orderData.subtotal || 0;
        this.tax = orderData.tax || 0;
        this.discount = orderData.discount || 0;
        this.total = orderData.total || 0;
        this.status = orderData.status || 'pending'; // completed, processing, pending
        this.paymentMethod = orderData.paymentMethod || 'cash';
        this.orderType = orderData.orderType || 'Takeout';
    }

    getDateOnly() {
        if (!this.timestamp) return '';
        if (this.timestamp.includes('T')) {
            return this.timestamp.split('T')[0];
        }
        return this.timestamp.substring(0, 10);
    }

    getFormattedTime() {
        try {
            const dateObj = new Date(this.timestamp);
            return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return this.timestamp;
        }
    }

    getItemsSummary() {
        if (!this.items || this.items.length === 0) return 'Standard Meal';
        return this.items.map(i => `${i.name} (x${i.qty})`).join(', ');
    }
}