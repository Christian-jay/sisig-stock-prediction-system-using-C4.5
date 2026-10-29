export class TodaysOrdersModel {
    constructor(orderData = {}) {
        this.id = orderData.id || `#${Math.floor(1000 + Math.random() * 9000)}`;
        // Store timestamp in Manila timezone (ISO format with +08:00 offset)
        const now = new Date();
        const manilaOffset = '+08:00';
        this.timestamp = orderData.timestamp || now.toLocaleString('en-CA', { timeZone: 'Asia/Manila', hour12: false }).replace(', ', 'T') + manilaOffset;
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
        // Return date in Manila timezone (YYYY-MM-DD)
        const dateObj = new Date(this.timestamp);
        return dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    }

    getFormattedTime() {
        try {
            const dateObj = new Date(this.timestamp);
            return dateObj.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) {
            return this.timestamp;
        }
    }

    getItemsSummary() {
        if (!this.items || this.items.length === 0) return 'Standard Meal';
        return this.items.map(i => `${i.name} (x${i.qty})`).join(', ');
    }
}